#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const shell = require('shelljs');
const ora = require('ora');
const { prompt } = require('inquirer');
const spinner = ora('Loading undead unicorns');
const { getScripts, getDependencies, getDevDependencies } = require('../utils');

const question = [
    {
        type: 'list',
        name: 'type',
        message: '请选择类型:',
        choices: ['react', 'vue']
    },
    {
        type: 'confirm',
        name: 'isTs',
        message: '是否为ts项目',
        default: false,
        validate(val){
            return val;
        }
    }
];

/**
 * 生成新的package.json
 * @param {*} pkj 老的package.json
 * @returns
 */
const generatePackage = async function(pkj) {
    const newScript = getScripts(pkj.scripts, ['prepare', 'changeLog', 'eslint-fixed']);
    const newDependencies = getDependencies(pkj.dependencies, ['commitizen', 'cz-customizable', 'cz-conventional-changelog', 'husky', 'lint-staged']);
    const newDevDependencies = await getDevDependencies(pkj.devDependencies, ['@commitlint/cli', '@commitlint/config-conventional', 'commitizen', 'cz-customizable', 'cz-conventional-changelog', 'husky', 'eslint', 'eslint-config-tongdun', 'eslint-plugin-td-rules-plugin', 'lint-staged']);

    if(newScript) {
        pkj.scripts = newScript;
    }

    if(newDependencies) {
        pkj.dependencies = newDependencies;
    }

    if(newDevDependencies) {
        pkj.devDependencies = newDevDependencies;
    }

    pkj['config'] = {
        'commitizen': {
            'path': './node_modules/cz-customizable'
        }
    };
    pkj['lint-staged'] = {
        'src/**/*.{js,jsx,ts,tsx}': [
            'eslint --max-warnings 0 --fix --ext .js,.jsx,.ts,.tsx'
        ]
    };

    return pkj;
};

module.exports = function() {
    prompt(question).then(async ({ type, isTs }) => {
        spinner.start('🚀 husky & eslint配置 初始化中');
        const str = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');

        if(!str) {
            spinner.stop('😄 初始化失败,请检查是否存在package.json');
            return;
        }
        // 重写package.json
        const packageJSON = JSON.parse(str);
        const newPackage = await generatePackage(packageJSON);
        fs.writeFileSync(path.resolve(process.cwd(), './package.json'), JSON.stringify(newPackage, null, 4));

        // 获取最新的template
        await shell.rm('-rf', path.resolve(__dirname, '../template'));
        await shell.exec(`git clone git@github.com:TDFE/ci-files.git ${path.resolve(__dirname, '../template')}`);

        // copy templatee里面的文件
        await shell.cp(path.resolve(__dirname, '../template/husky/commitlint.config.js'), process.cwd());
        await shell.cp(path.resolve(__dirname, '../template/husky/.cz-config.js'), process.cwd());
        await shell.cp(path.resolve(__dirname, `../template/eslint/${isTs ? type + 'Ts' : type}/.eslintrc`), process.cwd());
        await shell.cp(path.resolve(__dirname, '../template/eslint/.editorconfig'), process.cwd());

        await shell.cd(process.cwd());

        // 安装eslint需要删除node_modules 和 package-lock.json
        await shell.rm('-rf', 'package-lock.json');
        await shell.rm('-rf', 'node_modules');

        chalk.green('正在执行npm install');
        await shell.exec('npm i');

        await shell.exec('npm run prepare');
        await shell.cp(path.resolve(__dirname, '../template/husky/commit-msg'), '.husky');
        await shell.cp(path.resolve(__dirname, '../template/husky/pre-commit'), '.husky');
        await shell.cp(path.resolve(__dirname, '../template/husky/prepare-commit-msg'), '.husky');

        spinner.succeed('😄 初始化完成, 🤖️生成脚本');
    });
};
