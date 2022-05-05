#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const { prompt } = require('inquirer');
const { getCiCdQuest } = require('../common');
const { cloneTemplate, getCurPackjsonName } = require('../utils');

const spinner = ora('Loading undead unicorns');

module.exports = function () {
    let ciCdQuest = [];
    try{
        const defaultName = getCurPackjsonName();
        ciCdQuest = getCiCdQuest(defaultName);
    }catch(e) {
        console.log(e);
        shell.exec(2);
    }

    prompt(ciCdQuest).then(async ({ type, name }) => {
        spinner.start('🚀 cicd配置 初始化中');
        // 获取最新的template
        await shell.rm('-rf', path.resolve(__dirname, '../template'));
        await cloneTemplate();

        // 修改template里面的内容
        const filePath = path.resolve(__dirname, `../template/cicd/${type}/${type === 'node' ? 'pm2.json' : 'nginx.conf'}`);
        const str = fs.readFileSync(filePath, 'utf-8');
        fs.writeFileSync(filePath, str.replace(/\${APPNAME}/g, name));

        // copy templatee cicd里面的文件
        await shell.cp('-R', path.resolve(__dirname, `../template/cicd/${type}/`), process.cwd() + '/');
        spinner.succeed('😄 初始化完成, 🤖️生成脚本');
        shell.exit(0);
    }).catch(e => {
        console.log(e);
        shell.exit(1);
    });
};