#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const shell = require('shelljs');
const ora = require('ora');
const spinner = ora('Loading undead unicorns');
const lib = require('../lib')
const pkg = require('../package');

program.version(chalk.green(`${pkg.version}`))

program
.action(async() => {
    spinner.start("🚀 tdhusky 初始化中");
    await shell.exec(`cd ${process.cwd()}/ && npm install husky @commitlint/cli @commitlint/config-conventional --save-dev`);
    await shell.exec(`cd ${process.cwd()}/ && npm install commitizen cz-customizable cz-conventional-changelog --save`);
    await shell.exec(`cd ${process.cwd()}/ && commitizen init cz-customizable --save --save-exact`)
    await shell.exec(`cd ${process.cwd()}/ && npm set-script changeLog "rm -rf CHANGELOG.md && conventional-changelog -p angular -i CHANGELOG.md -s"`)
    await shell.exec(`cd ${process.cwd()}/ && npm set-script prepare "husky install" && npm run prepare`)
    spinner.succeed("😄 初始化完成, 🤖️生成脚本");
    await lib.create();
});

program.parse(process.argv)