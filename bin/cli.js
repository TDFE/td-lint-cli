#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const program = require('commander');
const chalk = require('chalk');
const shell = require('shelljs');
const ora = require('ora');
const spinner = ora('Loading undead unicorns');
const pkg = require('../package');
const { getSpace, getScripts, getDependencies, getDevDependencies } = require('../utils')

program.version(chalk.green(`${pkg.version}`))

program
.action(async() => {
    spinner.start("🚀 tdhusky 初始化中");
    const str = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');
    const packageJSON = JSON.parse(str)

    packageJSON.scripts = getScripts(packageJSON.scripts)
    if(packageJSON.dependencies) {
        packageJSON.dependencies = getDependencies(packageJSON.dependencies)
    }
    if(packageJSON.devDependencies) {
        packageJSON.devDependencies = await getDevDependencies(packageJSON.devDependencies)
    }
    packageJSON["config"] = {
        "commitizen": {
            "path": "./node_modules/cz-customizable"
        }
    }
    packageJSON["lint-staged"] = {
        "src/**/*.{js,jsx,ts,tsx}": [
            "eslint --max-warnings 0 --ext .js,.jsx,.ts,.tsx"
        ]
    }
    // 重写package.json
    fs.writeFileSync(path.resolve(process.cwd(), './package.json'), JSON.stringify(packageJSON, null, 4))

    // copy templatee里面的文件
    await shell.cp(path.resolve(__dirname, '../template/commitlint.config.js'), process.cwd())
    await shell.cp(path.resolve(__dirname, '../template/.cz-config.js'), process.cwd())
    await shell.cp(path.resolve(__dirname, '../template/.eslintrc'), process.cwd())
    await shell.cp(path.resolve(__dirname, '../template/.editorconfig'), process.cwd())

    await shell.cd(process.cwd())

    // 安装eslint需要删除node_modules 和 package-lock.json
    await shell.rm('-rf', 'package-lock.json')
    await shell.rm('-rf', 'node_modules')
    await shell.exec('npm i')

    // 执行git hook
    await shell.exec('npm run prepare')
    await shell.exec(`npx husky add .husky/commit-msg 'npx commitlint --edit'`)
    await shell.exec(`npx husky add .husky/pre-commit 'echo "开始对修改文件进行eslint校验'"`)
    await shell.exec(`npx husky add .husky/pre-commit 'npx --no-install lint-staged'`)
    await shell.exec(`npx husky add .husky/prepare-commit-msg 'exec < /dev/tty && node_modules/.bin/cz --hook || true'`)
    spinner.succeed("😄 初始化完成, 🤖️生成脚本");
});

program.parse(process.argv)
