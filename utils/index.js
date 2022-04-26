const path = require('path');
const download = require('download-git-repo');
const Npm = require('npm-api');
const shell = require('shelljs');

const npm = new Npm();

/**
 * 重新生成scripts
 * @param {*} scripts 老的package.json里面的scripts
 * @param {*} cliList 新增的命令
 * @returns
 */
function getScripts(scripts = {}, cliList) {
    const mapCli = {
        'prepare': 'husky install',
        'changeLog': 'rm -rf CHANGELOG.md && conventional-changelog -p angular -i CHANGELOG.md -s',
        'eslint-fixed': 'npx eslint --max-warnings 0 --fix --ext .js,.jsx,.ts,.tsx ./src'
    };

    cliList.forEach(i => {
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
function getDependencies(dependencies = {}, deleteList, deleteKey) {
    deleteList.forEach(i => {
        delete dependencies[i];
    });

    if (deleteKey) {
        for (let key in dependencies) {
            // 删除deleteKey相关的包
            if (key.includes(deleteKey)) {
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
 * @returns
 */
async function getDevDependencies(devDependencies = {}, addList, deleteKey) {
    const list = await Promise.all(addList.map(i => npm.repo(i).package()));

    if (deleteKey) {
        for (let key in devDependencies) {
            // 删除deleteKey相关的包
            if (key.includes(deleteKey)) {
                delete devDependencies[key];
            }
        }
    }

    addList.forEach((i, index) => {
        devDependencies[i] = `^${list[index].version}`;
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

module.exports = {
    getScripts,
    getDependencies,
    getDevDependencies,
    cloneTemplate
};
