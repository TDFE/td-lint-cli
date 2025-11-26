#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const getProjectImport = require('./getProjectImport');
const getPackageLockDep = require('./getPackageLockDep');

const spinner = ora('Loading undead unicorns');

const resolve = (dir) => path.resolve(process.cwd(), dir);

module.exports = async function () {
    spinner.start('🚀 开始检查幽灵依赖\n');
    try {
        const dirsToScan = [resolve('./src'), resolve('./modules')]; // 你要扫描的目录
        const packageDev = Object.keys(JSON.parse(fs.readFileSync(resolve('./package.json'), 'utf-8'))?.dependencies);
        const { packageLockList, packageLockMap } = await getPackageLockDep();
        const importModules = getProjectImport(dirsToScan);
        const result = packageLockList.filter((i) => {
            return importModules.includes(i) && !packageDev.includes(i);
        });
        if (!Array.isArray(result) || !result.length) {
            spinner.succeed('当前工程无幽灵依赖');
            shell.exit(0);
        } else {
            const list = result.map((i) => {
                const version = packageLockMap[`node_modules/${i}`]?.version;
                return '"' + i + '": ' + '"' + version + '"';
            });
            console.log(list.join(',\n'));
            spinner.succeed('幽灵依赖检查完成, 请添加以上内容至工程package.json中');
        }
    } catch (err) {
        console.error('幽灵依赖检查失败:', err);
        shell.exit(0);
    }
};
