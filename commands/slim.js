#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const lodash = require('lodash');
const shell = require('shelljs');
const merge = require('webpack-merge');
const { prompt } = require('inquirer');
const fg = require('fast-glob');
const ora = require('ora');
const micromatch = require('micromatch');
const { slimQuest } = require('../common');
const spinner = ora('Loading undead unicorns');

const filterFiles = ['src/index.ejs', 'src/index.js', 'src/index.html'];

function readSlimIgnore(cwd) {
    const configPath = path.join(cwd, 'tdmc.config.json');
    if (!fs.existsSync(configPath)) return [];
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return Array.isArray(config.exclude) ? config.exclude : [];
    } catch (e) {
        console.error('[slim] tdmc.config.json 解析失败:', e.message);
        return [];
    }
}

function isSlimIgnored(filePath, cwd, patterns) {
    if (!patterns.length) return false;
    const relativePath = path.relative(cwd, filePath);
    return patterns.some((pattern) => {
        const normalized = pattern.replace(/\/$/, '');
        if (relativePath === normalized || relativePath.startsWith(normalized + '/')) {
            return true;
        }
        const globPatterns = pattern.startsWith('**/') ? [pattern] : [pattern, `**/${pattern}`];
        return micromatch.isMatch(relativePath, globPatterns);
    });
}

class Slim {
    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync('Slim', (compilation, callback) => {
            // 打包用到的所有文件
            const assets = Array.from(compilation.fileDependencies);
            // 过滤掉其他文件，保留src目录下的文件
            const usedFiles = assets.reduce((total, item) => {
                if (item.includes('/src/') && !item.includes('/node_modules/')) {
                    total.push(item);
                }
                return total;
            }, []);
            compilation.warnings = usedFiles;
            callback();
        });
    }
}

module.exports = function () {
    try {
        prompt(slimQuest).then(async ({ isDel, webpackPath, dirName }) => {
            const cwd = process.cwd();
            const slimIgnorePatterns = readSlimIgnore(cwd);
            let baseWebpackConfig = require(`${cwd}/${webpackPath}`);
            const allFiles = fg.sync([`${cwd}/${dirName}/**/*.*`]);
            baseWebpackConfig.module =
                typeof baseWebpackConfig.module === 'function' ? baseWebpackConfig.module(true) : baseWebpackConfig.module;
            spinner.start('正在查询依赖，可能会花费数分钟，请稍后');
            webpack(
                merge(lodash.pick(baseWebpackConfig, ['entry', 'resolve', 'module']), {
                    mode: 'none',
                    plugins: [new Slim()]
                }),
                (err, stats) => {
                    if (err) {
                        console.error(err);
                        spinner.stop('错误');
                        return;
                    }
                    if (stats.hasWarnings()) {
                        const info = stats.toJson();
                        let unUsedFiles = [];
                        const usedFiles = Array.isArray(info.warnings) ? info.warnings.map((i) => i.message) : [];
                        if (Array.isArray(allFiles)) {
                            unUsedFiles = allFiles.reduce((total, item) => {
                                if (
                                    !usedFiles.includes(item) &&
                                    !filterFiles.some((fileName) => item.includes(fileName)) &&
                                    !isSlimIgnored(item, cwd, slimIgnorePatterns) &&
                                    item.endsWith('.js')
                                ) {
                                    total.push(item);
                                }
                                return total;
                            }, []);
                        }

                        if (Array.isArray(unUsedFiles)) {
                            console.warn('以下文件文件没有被采用，请确认是否需要删除');
                            unUsedFiles.forEach((i) => {
                                console.warn(path.relative(cwd, i));
                                if (isDel) {
                                    shell.rm('-rf', i);
                                }
                            });
                            spinner.succeed(`完成查找,共计${unUsedFiles.length}个`);
                        }
                        return;
                    }
                    spinner.succeed('搜索完毕');
                    console.log('当前src目录下所有文件都已经被使用');
                }
            );
        });
    } catch (error) {
        console.error(error);
        shell.exit(1);
    }
};
