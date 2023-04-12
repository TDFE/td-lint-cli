#!/usr/bin/env node
const fs = require('fs');
const webpack = require('webpack');
const lodash = require('lodash');
const shell = require('shelljs');
const merge = require('webpack-merge');
const { prompt } = require('inquirer');
const ora = require('ora');
const { slimPackageQuest } = require('../common');
const spinner = ora('Loading undead unicorns');

class SlimPackage {
    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync('SlimPackage', (compilation, callback) => {
            // 打包用到的所有文件
            const assets = Array.from(compilation.fileDependencies);
            // 过滤掉其他文件，保留src目录下的文件
            const usedFiles = assets.reduce((total, item) => {
                if (item.includes('/node_modules/')) {
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
        prompt(slimPackageQuest).then(async ({ isDel, webpackPath }) => {
            const baseWebpackConfig = require(`${process.cwd()}/${webpackPath}`);
            const pkg = require(process.cwd() + '/package.json');
            const allFiles = [];
            for (const i in pkg.dependencies) {
                allFiles.push(i);
            }

            spinner.start('正在查询依赖，可能会花费数分钟，请稍后');
            webpack(
                merge(lodash.pick(baseWebpackConfig, ['entry', 'resolve', 'module']), {
                    mode: 'none',
                    plugins: [new SlimPackage()]
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
                                if (!usedFiles.some((i) => i.includes(item))) {
                                    total.push(item);
                                }
                                return total;
                            }, []);
                        }

                        if (Array.isArray(unUsedFiles)) {
                            console.warn('以下npm包没有被采用，请确认是否需要删除');
                            unUsedFiles.forEach((i) => {
                                console.warn(i);
                            });
                            if (isDel) {
                                const newPkg = JSON.stringify(
                                    pkg,
                                    function (key, value) {
                                        if (key === 'dependencies') {
                                            const obj = {};
                                            for (const attr in value) {
                                                if (!unUsedFiles.includes(attr)) {
                                                    obj[attr] = value[attr];
                                                }
                                            }
                                            return obj;
                                        }
                                        return value;
                                    },
                                    4
                                );
                                fs.writeFileSync(process.cwd() + '/package.json', newPkg, 'utf-8');
                            }

                            spinner.succeed(`完成查找,共计${unUsedFiles.length}个`);
                        }
                        return;
                    }
                    spinner.succeed('搜索完毕');
                }
            );
        });
    } catch (error) {
        console.error(error);
        shell.exit(1);
    }
};
