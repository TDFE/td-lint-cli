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

const baseWebpackConfig = require(`${process.cwd()}/build/webpack.base.conf`);

const args = process.argv.splice(2)[1] || 'src';

const allFiles = fg.sync([`${process.cwd()}/${args}/**/*.*`]);

const filterFiles = ['src/index.ejs', 'src/index.js'];

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

            if (Array.isArray(allFiles)) {
                const unUsedFiles = allFiles.reduce((total, item) => {
                    if (!usedFiles.includes(item) && !filterFiles.some((fileName) => item.includes(fileName))) {
                        total.push(item);
                    }
                    return total;
                }, []);

                if (unUsedFiles.length) {
                    compilation.warnings = ['以下文件文件没有被采用，请确认是否需要删除'].concat(unUsedFiles);
                }
            }

            callback();
        });
    }
}

module.exports = function () {
    try {
        prompt(slimQuest).then(async ({ isDel }) => {
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
                    const info = stats.toJson();

                    if (stats.hasWarnings()) {
                        const warns = [];
                        if (Array.isArray(info.warnings)) {
                            info.warnings.forEach((i) => {
                                warns.push(i.message && i.message.replace(`${process.cwd()}/`, ''));
                                if (isDel) {
                                    shell.rm('-rf', i.message);
                                }
                            });
                        }
                        const str = warns.join('\n');
                        console.warn(str);
                        spinner.succeed(`完成查找,共计${warns.length - 1}个`);

                        return;
                    }
                    console.log('当前src目录下所有文件都已经被使用');
                }
            );
        });
    } catch (error) {
        console.log(error);
        shell.exit(1);
    }
};
