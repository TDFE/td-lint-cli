#!/usr/bin/env node
const webpack = require('webpack');
const lodash = require('lodash');
const shell = require('shelljs');
const merge = require('webpack-merge');
const { prompt } = require('inquirer');
const fg = require('fast-glob');
const ora = require('ora');
const { slimQuest } = require('../common');
const spinner = ora('Loading undead unicorns');

const filterFiles = ['src/index.ejs', 'src/index.js', 'src/index.html'];

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
            const baseWebpackConfig = require(`${process.cwd()}/${webpackPath}`);
            const allFiles = fg.sync([`${process.cwd()}/${dirName}/**/*.*`]);

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
                                if (!usedFiles.includes(item) && !filterFiles.some((fileName) => item.includes(fileName))) {
                                    total.push(item);
                                }
                                return total;
                            }, []);
                        }

                        if (Array.isArray(unUsedFiles)) {
                            console.warn('以下文件文件没有被采用，请确认是否需要删除');
                            unUsedFiles.forEach((i) => {
                                console.warn(i.replace(`${process.cwd()}/`, ''));
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
