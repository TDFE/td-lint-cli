const fs = require('fs');
const path = require('path');
const download = require('download-git-repo');
// const Npm = require('npm-api');
const shell = require('shelljs');
const { mapVersion } = require('../common/index');

// const npm = new Npm();

/**
 * 重新生成scripts
 * @param {*} scripts 老的package.json里面的scripts
 * @param {*} cliList 新增的命令
 * @returns
 */
function getScripts(scripts = {}, cliList) {
    const mapCli = {
        vite: 'vite',
        prepare: 'husky install',
        changeLog: 'rm -rf CHANGELOG.md && conventional-changelog -p angular -i CHANGELOG.md -s',
        'eslint-fixed': 'npx eslint --max-warnings 0 --fix --ext .js,.jsx,.ts,.tsx ./src'
    };

    cliList.forEach((i) => {
        if (Object.keys(mapCli).includes(i)) {
            scripts[i] = mapCli[i];
        }
    });

    return scripts;
}

/**
 * 重新生成dependencies
 * @param {*} dependencies 老的package.json里面的dependencies
 * @param {*} deleteList 需要删除的包名
 * @param {*} deleteKey 有这个key的包就要删除
 * @returns
 */
function getDependencies(dependencies = {}, deleteList, deleteKeys) {
    deleteList.forEach((i) => {
        delete dependencies[i];
    });

    if (Array.isArray(deleteKeys)) {
        for (let key in dependencies) {
            // 删除deleteKey相关的包
            const nendDel = deleteKeys.some((i) => key.includes(i));
            if (nendDel) {
                delete dependencies[key];
            }
        }
    }

    return dependencies;
}

/**
 * 重新生成devDependencies
 * @param {*} devDependencies 老的package.json里面的devDependencies
 * @param {*} addList 需要新增的包
 * @param {*} deleteKeys 需要删除的包
 * @returns
 */
async function getDevDependencies(devDependencies = {}, addList, deleteKeys) {
    // const list = await Promise.all(addList.map((i) => npm.repo(i).package()));

    if (Array.isArray(deleteKeys)) {
        for (let key in devDependencies) {
            // 删除deleteKey相关的包
            const nendDel = deleteKeys.some((i) => key.includes(i));
            if (nendDel) {
                delete devDependencies[key];
            }
        }
    }
    addList.forEach((i, index) => {
        // // 远程的最高版本
        // const originBigVersion = list[index].version && list[index].version[0];
        // 本地的最高版本
        // const localBigVersion = mapVersion[i] ? mapVersion[i][0] : -1;
        // let version = list[index].version;

        // if (localBigVersion !== -1) {
        //     version = localBigVersion === originBigVersion ? list[index].version : mapVersion[i];
        // }

        devDependencies[i] = `^${mapVersion[i]}`;
    });

    return devDependencies;
}

/**
 * 下载远程仓库的配置文件
 * @returns
 */
async function cloneTemplate() {
    return new Promise((resolve, reject) => {
        download(
            'direct:https://gitee.com/tdfe/template-ci-files#master',
            path.resolve(__dirname, '../template'),
            { clone: true },
            function (error) {
                if (error) {
                    reject(error);
                    shell.exit();
                }
                resolve();
            }
        );
    });
}

/**
 * 根据类型获取不同的配置
 * @param {*} type js | vue | react
 * @param {*} isTs boolean
 * @returns string
 */
function getEslintPath(type, isTs) {
    const mapPathByType = {
        js: isTs ? 'ts' : 'js',
        react: isTs ? 'reactTs' : 'react',
        vue: isTs ? 'vueTs' : 'vue'
    };
    return mapPathByType[type];
}

/**
 * 获取当前项目名
 */
function getCurPackjsonName() {
    const pkg = fs.readFileSync(process.cwd() + '/package.json', 'utf-8');
    return JSON.parse(pkg).name;
}

module.exports = {
    getScripts,
    getDependencies,
    getDevDependencies,
    cloneTemplate,
    getEslintPath,
    getCurPackjsonName
};
