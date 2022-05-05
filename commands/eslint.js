#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const { prompt } = require('inquirer');
const { question } = require('../common');
const spinner = ora('Loading undead unicorns');
const { getScripts, getDependencies, getDevDependencies, cloneTemplate, getEslintPath } = require('../utils');

/**
 * 生成新的package.json
 * @param {*} pkj 老的package.json
 * @param {*} isTs 是否为ts
 * @returns
 */
const generatePackage = async function (pkj, isTs) {
    const tsArr = ['typescript', '@types/node', '@types/react', '@types/react-dom', '@types/jest'];
    // dependencies需要删除的包
    const dependenciesNeedDel = ['lint-staged'].concat(isTs ? tsArr : []);
    // 需要删除的关键词
    const needDelKey = ['eslint'].concat(isTs ? tsArr : []);
    // devDependencies需要增加的包
    const devDependenciesNeedAdd = ['eslint', 'eslint-config-tongdun', 'eslint-plugin-td-rules-plugin', 'lint-staged'].concat(isTs ? tsArr : []);
    const newScript = getScripts(pkj.scripts, ['eslint-fixed']);
    const newDependencies = getDependencies(pkj.dependencies, dependenciesNeedDel, needDelKey);
    const newDevDependencies = await getDevDependencies(pkj.devDependencies, devDependenciesNeedAdd, needDelKey);

    if (newScript) {
        pkj.scripts = newScript;
    }

    if (newDependencies) {
        pkj.dependencies = newDependencies;
    }

    if (newDevDependencies) {
        pkj.devDependencies = newDevDependencies;
    }

    pkj['lint-staged'] = {
        'src/**/*.{js,jsx,ts,tsx}': [
            'eslint --quiet --fix --ext .js,.jsx,.ts,.tsx'
        ]
    };

    return pkj;
};

module.exports = function () {
    prompt(question).then(async ({ type, isTs }) => {
        spinner.start('🚀 eslint配置 初始化中');
        const str = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');

        if (!str) {
            spinner.stop('😄 初始化失败,请检查是否存在package.json');
            return;
        }
        // 重写package.json
        const packageJSON = JSON.parse(str);
        const newPackage = await generatePackage(packageJSON, isTs);
        fs.writeFileSync(path.resolve(process.cwd(), './package.json'), JSON.stringify(newPackage, null, 4));

        // 获取最新的template
        await shell.rm('-rf', path.resolve(__dirname, '../template'));
        await cloneTemplate();

        // copy templatee里面的文件
        await shell.cp(path.resolve(__dirname, `../template/eslint/${getEslintPath(type, isTs)}/.eslintrc`), process.cwd());
        await shell.cp(path.resolve(__dirname, '../template/eslint/.editorconfig'), process.cwd());

        // 如果工程里面有build.sh文件 并且非node项目
        if(shell.test('-e', path.resolve(process.cwd(), './build.sh')) && !shell.test('-e', path.resolve(process.cwd(), './pm2.json'))){
            await shell.cp(path.resolve(__dirname, '../template/eslint/build.sh'), process.cwd());
        }

        await shell.cd(process.cwd());

        // 安装eslint需要删除node_modules 和 package-lock.json 以及
        await shell.rm('-rf', 'package-lock.json');
        await shell.rm('-rf', '.prettierrc');
        await shell.rm('-rf', 'node_modules');

        spinner.succeed('😄 初始化完成, 🤖️生成脚本');
        spinner.start('正在执行npm install');

        await shell.exec('npm i --registry=https://registry.npmmirror.com/');

        spinner.succeed('安装完成');
        shell.exit(0);
    }).catch(e => {
        console.log(e);
        shell.exit(1);
    });
};
