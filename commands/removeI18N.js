#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const spinner = ora('Loading undead unicorns');
const { cloneTemplate } = require('../utils');

module.exports = async function () {
    try {
        spinner.start('🚀 去除I18N配置初始化中');

        // 获取最新的template
        await shell.rm('-rf', path.resolve(__dirname, '../template'));
        await cloneTemplate();

        // 确保目标目录存在
        const removeI18NPath = path.resolve(process.cwd(), 'build/removeI18N');

        if (!fs.existsSync(removeI18NPath)) {
            await shell.mkdir('-p', removeI18NPath);
        }

        // 将模板目录中的 removeI18N/* 下的所有文件复制到当前工作目录的 build/removeI18N 目录下
        await shell.cp('-R', [path.resolve(__dirname, '../template/removeI18N/*')], path.resolve(process.cwd(), 'build/removeI18N'));

        await shell.cd(process.cwd());

        spinner.succeed('😄 去除I18N配置初始化完成');

        shell.exit(0);
    } catch (error) {
        console.log(error);
        shell.exit(1);
    }
};
