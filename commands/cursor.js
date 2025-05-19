#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const spinner = ora('Loading undead unicorns');
const { getScripts, getDependencies, getDevDependencies, cloneTemplate } = require('../utils');


module.exports = async function () {
    try {
        spinner.start('🚀 cursor 规则初始化中');

        // 获取最新的template
        await shell.rm('-rf', path.resolve(__dirname, '../template'));
        await cloneTemplate();

        // 确保目标目录存在
        const cursorRulesPath = path.resolve(process.cwd(), '.cursor/rules');
        console.log(cursorRulesPath, 'cursorRulesPath');
        if (!fs.existsSync(cursorRulesPath)) {
            await shell.mkdir('-p', cursorRulesPath);
        }

        // 将模板目录中的 .cursor/rules 下的所有文件复制到当前工作目录的 .cursor/rules 目录下
        await shell.cp(
            '-R',
            [path.resolve(__dirname, '../template/.cursor/rules/*')],
            path.resolve(process.cwd(), '.cursor/rules')
        );

        await shell.cd(process.cwd());

        spinner.succeed('😄 cursor 规则初始化完成');

        shell.exit(0);
    } catch (error) {
        console.log(error);
        shell.exit(1);
    }
};
