#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const depcheck = require('depcheck');

const filterKeys = ['tntd', '~modules'];

const options = {
    // 忽略的文件/目录
    ignoreDirs: [
        'dist',
        'build',
        'node_modules',
        '.husky',
        '.octopus',
        'mock',
        'mocker',
        'public',
        'modules',
        '.cz-config.js',
        '.editorconfig',
        '.eslintrc',
        '.gitmodules',
        '.prettierrc',
        'babel.config.json',
        'build.sh',
        'commitlint.config.js',
        'Dockerfile',
        'jsconfig.json',
        'nginx.conf',
        'otp-config.json',
        'README.md',
        'ok.htm',
        'test.js',
        'test-pnpm.js',
        'test-npm.js',
        'test-depcheck.js'
    ],
    // 忽略的依赖名（正则或字符串）
    ignoreMatches: []
};

const spinner = ora('Loading undead unicorns');

module.exports = async function () {
    if (!fs.existsSync(path.resolve(process.cwd(), 'package-lock.json'))) {
        console.log('请先执行npm i, 生成package-lock.json文件');
        return;
    }
    spinner.start('🚀 开始检查幽灵依赖\n');
    const str = fs.readFileSync(path.resolve(process.cwd(), 'package-lock.json'), 'utf-8');

    const { packages } = JSON.parse(str);

    // 获取最新的template
    depcheck(process.cwd(), options)
        .then((unused) => {
            const missingKey = Object.keys(unused.missing);
            const filterMissingKey = missingKey.filter((i) => {
                return !filterKeys.some((el) => i.includes(el));
            });

            let list = [];
            if (!Array.isArray(filterMissingKey) || !filterMissingKey.length) {
                spinner.succeed('当前工程无幽灵依赖');
                shell.exit(0);
            } else {
                list = filterMissingKey.map((i) => {
                    const version = packages[`node_modules/${i}`]?.version;
                    return '"' + i + '": ' + '"^' + version + '"';
                });
                console.log(list.join(',\n'));
                spinner.succeed('幽灵依赖检查完成, 请添加以上内容至工程package.json中');
            }
        })
        .catch((err) => {
            console.error('幽灵依赖检查失败:', err);
            shell.exit(0);
        });
};
