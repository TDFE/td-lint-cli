#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const chalk = require('chalk');
const shell = require('shelljs');
const ora = require('ora');
const spinner = ora('Loading undead unicorns');
const { getScripts, getDependencies, getDevDependencies } = require('../utils')

/**
 * 生成新的package.json
 * @param {*} pkj 老的package.json
 * @returns 
 */
const generatePackage = async function(pkj) {
    const newScript = getScripts(pkj.scripts, ["prepare", "changeLog"])
    const newDependencies = getDependencies(pkj.dependencies, ["commitizen", 'cz-customizable', "cz-conventional-changelog", "husky"])
    const newDevDependencies = await getDevDependencies(pkj.devDependencies, ["@commitlint/cli", "@commitlint/config-conventional", "commitizen", "cz-customizable", "cz-conventional-changelog", "husky"])

    if(newScript && Object.keys(newScript).length >= 1) {
        pkj.scripts = newScript;
    }
   
    if(newDependencies && Object.keys(newDependencies).length >= 1) {
        pkj.dependencies = newDependencies;
    }

    if(newDevDependencies && Object.keys(newDevDependencies).length >= 1) {
        pkj.devDependencies = newDevDependencies;
    }

    pkj["config"] = {
        "commitizen": {
            "path": "./node_modules/cz-customizable"
        }
    }

    return pkj
}

module.exports = async function() {
    spinner.start("🚀 husky 初始化中");
    const str = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');

    if(!str) {
        spinner.succeed("😄 初始化失败,请检查是否存在package.json"); 
    }
    // 重写package.json
    const packageJSON = JSON.parse(str)
    const newPackage = await generatePackage(packageJSON)
    fs.writeFileSync(path.resolve(process.cwd(), './package.json'), JSON.stringify(newPackage, null, 4))
     
    // 获取最新的template
    await shell.rm('-rf',  path.resolve(__dirname, '../template'))
    await shell.exec(`git clone git@github.com:TDFE/ci-files.git ${path.resolve(__dirname, '../template')}`)

    // copy templatee里面的文件
    await shell.cp(path.resolve(__dirname, '../template/husky/commitlint.config.js'), process.cwd())
    await shell.cp(path.resolve(__dirname, '../template/husky/.cz-config.js'), process.cwd())
            
    await shell.cd(process.cwd())

    chalk.green("正在执行npm install")
    await shell.exec('npm i')

    // 执行git hook
    await shell.exec('npm run prepare')
    await shell.cp(path.resolve(__dirname, '../template/husky/commit-msg'), '.husky')
    await shell.cp(path.resolve(__dirname, '../template/husky/pre-commit'), '.husky')
    await shell.cp(path.resolve(__dirname, '../template/husky/prepare-commit-msg'), '.husky')

    spinner.succeed("😄 初始化完成, 🤖️生成脚本");
}
