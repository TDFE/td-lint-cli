const Npm = require('npm-api');

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
        'eslint-fixed': 'npx eslint --max-warnings 0 --ext .js,.jsx,.ts,.tsx ./src'
    };

    cliList.forEach(i => {
        if(Object.keys(mapCli).includes(i)) {
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

    if(deleteKey) {
        for(let key in dependencies) {
            // 删除deleteKey相关的包
            if(key.includes(deleteKey)) {
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
async function getDevDependencies(devDependencies = {}, addList) {
    for(let i of addList) {
        const info = await npm.repo(i).package();
        devDependencies[i] = `^${info.version}`;
    }

    return devDependencies;
}

module.exports = {
    getScripts,
    getDependencies,
    getDevDependencies
};
