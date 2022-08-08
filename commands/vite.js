#!/usr/bin / env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const spinner = ora('Loading undead unicorns');
const { getScripts, getDevDependencies, cloneTemplate } = require('../utils');

/**
 * 生成新的package.json
 * @param {*} pkj 老的package.json
 * @returns
 */
const generatePackage = async function (pkj) {
    const newScript = getScripts(pkj.scripts, ['vite']);
    const newDevDependencies = await getDevDependencies(pkj.devDependencies, ['vite-plugin-tongdun-transform'], []);

    if (newScript && Object.keys(newScript).length >= 1) {
        pkj.scripts = newScript;
    }

    if (newDevDependencies && Object.keys(newDevDependencies).length >= 1) {
        pkj.devDependencies = {
            ...newDevDependencies,
            '@originjs/vite-plugin-commonjs': '1.0.3',
            '@rollup/plugin-inject': '4.0.4',
            '@vitejs/plugin-legacy': '2.0.0',
            '@vitejs/plugin-react': '2.0.0',
            'postcss-modules': '4.3.1',
            vite: '3.0.3',
            'vite-plugin-imp': '2.2.0'
        };
    }

    return pkj;
};

module.exports = async function () {
    try {
        spinner.start('🚀 vite配置 初始化中');
        const str = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');

        if (!str) {
            spinner.stop('😄 vite初始化失败,请检查是否存在package.json文件');
            return;
        }
        // 重写package.json
        const packageJSON = JSON.parse(str);
        const newPackage = await generatePackage(packageJSON);
        fs.writeFileSync(path.resolve(process.cwd(), './package.json'), JSON.stringify(newPackage, null, 4));

        // 获取最新的template
        await shell.rm('-rf', path.resolve(__dirname, '../template'));
        await cloneTemplate();

        // copy templatee里面的文件
        await shell.cp('-R', [path.resolve(__dirname, '../template/vite/react/*')], process.cwd());

        await shell.cd(process.cwd());

        spinner.succeed('😄 vite初始化完成');
        spinner.start('正在执行npm install');

        await shell.exec('npm i');

        spinner.succeed('安装完成');

        shell.exit(0);
    } catch (error) {
        console.log(error);
        shell.exit(1);
    }
};
