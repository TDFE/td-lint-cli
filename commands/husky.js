#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const spinner = ora('Loading undead unicorns');
const { getScripts, getDependencies, getDevDependencies, cloneTemplate } = require('../utils');

/**
 * 生成新的package.json
 * @param {*} pkj 老的package.json
 * @returns
 */
const generatePackage = async function (pkj) {
    const newScript = getScripts(pkj.scripts, ['prepare', 'changeLog']);
    const newDependencies = getDependencies(pkj.dependencies, ['commitizen', 'cz-customizable', 'cz-conventional-changelog', ['husky', 'conventional-changelog-cli']]);
    const newDevDependencies = await getDevDependencies(pkj.devDependencies, ['@commitlint/cli', '@commitlint/config-conventional', 'commitizen', 'cz-customizable', 'cz-conventional-changelog', 'husky', 'conventional-changelog-cli'], []);

    if (newScript && Object.keys(newScript).length >= 1) {
        pkj.scripts = newScript;
    }

    if (newDependencies && Object.keys(newDependencies).length >= 1) {
        pkj.dependencies = newDependencies;
    }

    if (newDevDependencies && Object.keys(newDevDependencies).length >= 1) {
        pkj.devDependencies = newDevDependencies;
    }

    pkj['config'] = {
        'commitizen': {
            'path': './node_modules/cz-customizable'
        }
    };

    return pkj;
};

module.exports = async function () {
    try {
        spinner.start('🚀 husky 初始化中');
        const str = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');

        if (!str) {
            spinner.stop('😄 初始化失败,请检查是否存在package.json');
            return;
        }
        // 重写package.json
        const packageJSON = JSON.parse(str);
        const newPackage = await generatePackage(packageJSON);
        fs.writeFileSync(path.resolve(process.cwd(), './package.json'), JSON.stringify(newPackage, null, 4));

        // 获取最新的template
        await shell.rm('-rf', path.resolve(__dirname, '../template'));
        await cloneTemplate();

        // 先删除pre-commit这个钩子
        await shell.rm('-rf', path.resolve(__dirname, '../template/husky/.husky/pre-commit'));

        // copy templatee里面的文件
        await shell.cp('-R', [path.resolve(__dirname, '../template/husky/*'), path.resolve(__dirname, '../template/husky/.*')], process.cwd());

        await shell.cd(process.cwd());

        spinner.succeed('😄 初始化完成, 🤖️生成脚本');
        spinner.start('正在执行npm install');

        await shell.exec('npm i');

        spinner.succeed('安装完成');

        // 增加hook 钩子
        await shell.exec('npm run prepare');

        shell.exit(0);
    } catch (error) {
        console.log(error);
        shell.exit(1);
    }
};
