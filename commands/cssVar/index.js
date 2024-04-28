#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const { merge } = require('lodash');
const { prompt } = require('inquirer');
const { cssVarQuest } = require('../../common');
const defaultConf = require('./conf');
const spinner = ora('Loading undead unicorns');

/**
 * 获取css的替换信息
 * @returns
 */
const getCssVarKeyMap = (defaultConf) => {
    let addJson = '{}';
    let lowJson = {};
    try {
        const cssVarJson = path.resolve(process.cwd(), './cssVar.json');
        if (fs.existsSync(cssVarJson)) {
            addJson = fs.readFileSync(cssVarJson, 'utf-8');
        }

        for (let i in defaultConf) {
            lowJson[i.toLowerCase()] = defaultConf[i];
        }
        const cssVarKeys = merge(lowJson, JSON.parse(addJson));
        return cssVarKeys;
    } catch (e) {
        return lowJson;
    }
};

/**
 * 循环更新对应的值
 * @param {*} directory
 */
function updateLessFiles(directory, cssVarKeys, list) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const filepath = path.join(directory, file);
        const stats = fs.statSync(filepath);

        if (stats.isDirectory()) {
            updateLessFiles(filepath, cssVarKeys, list); // 递归处理子目录
        } else if (file.endsWith('.less')) {
            updateLessFile(filepath, cssVarKeys, list); // 处理.less文件
        }
    }
}

/** 更新文件 */
async function updateLessFile(filepath, cssVarKeys = {}, memoryList) {
    const str = fs.readFileSync(filepath, 'utf-8');
    const list = str.split('\n');

    const newList = list.map((i) => {
        if (i.includes(':')) {
            const [key, value] = i.split(':') || [];
            const { attrs, variables, getvariables } = cssVarKeys[value.trim().toLocaleLowerCase().replace(';', '')] || {};

            if (['margin', 'padding'].includes(key.trim())) {
                const val = value
                    ?.trim()
                    ?.replace(';', '')
                    ?.split(' ')
                    .map((i) => {
                        const item = cssVarKeys[i];

                        return item?.getvariables(key.trim()) || i;
                    });
                if (Array.isArray(val)) {
                    return i.replace(value, ' ' + val.join(' ') + ';');
                }

                return i;
            }

            if (getvariables) {
                if (!getvariables(key.trim())) {
                    return i;
                }
                return i.replace(value.trim().replace(';', ''), getvariables(key.trim()));
            }

            if (Array.isArray(attrs) && attrs.includes(key.trim())) {
                return i.replace(value.trim().replace(';', ''), variables);
            }
        }

        return i;
    });

    memoryList.push({
        filePath: filepath,
        content: newList.join('\n')
    });

    console.log(`完成${filepath}文件的替换`);
}

module.exports = function () {
    prompt(cssVarQuest)
        .then(({ goalPath }) => {
            let list = [];
            spinner.start('🚀 开始抽取');
            // 需要转换的key
            const cssVarKeys = getCssVarKeyMap(defaultConf);
            updateLessFiles(path.resolve(process.cwd(), goalPath), cssVarKeys, list);
            spinner.succeed('😄 抽取完成, 🤖️');
            spinner.start('🚀 开始替换');
            list.forEach((i) => {
                fs.writeFileSync(i.filePath, i.content, 'utf-8');
            });
            spinner.succeed('😄 替换完成, 🤖️');
            shell.exit(0);
        })
        .catch((e) => {
            console.log(e);
            shell.exit(1);
        });
};
