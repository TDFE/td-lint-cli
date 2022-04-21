const Npm = require('npm-api')

const npm = new Npm();

/**
 * 重新生成scripts
 * @param {*} scripts 老的package.json里面的scripts
 * @param {*} cliList 新增的命令
 * @returns 
 */
function getScripts(scripts, cliList) {
    if(!scripts) {
        return undefined
    }
    const mapCli = {
        "prepare": "husky install",
        "changeLog": "rm -rf CHANGELOG.md && conventional-changelog -p angular -i CHANGELOG.md -s",
        "eslint-fixed": "npx eslint --max-warnings 0 --fix --ext .js,.jsx,.ts,.tsx ./src"
    }

    cliList.forEach(i => {
        if(Object.keys(mapCli).includes(i)) {
            scripts[i] = mapCli[i]
        }
    })

	return scripts
}

/**
 * 重新生成dependencies
 * @param {*} dependencies 老的package.json里面的dependencies
 * @param {*} deleteList 需要删除的包名
 * @param {*} deleteKey 有这个key的包就要删除
 * @returns 
 */
function getDependencies(dependencies, deleteList, deleteKey) {
	deleteList.forEach(i => {
		delete dependencies[i]
	})

    if(deleteKey) {
        for(let key in dependencies) {
            // 删除deleteKey相关的包
            if(key.includes(deleteKey)) {
                delete dependencies[key]
            }
        }
    }

	return dependencies
}

/**
 * 重新生成devDependencies
 * @param {*} devDependencies 老的package.json里面的devDependencies
 * @param {*} addList 需要新增的包
 * @returns 
 */
async function getDevDependencies(devDependencies, addList) {

    for(let i of addList) {
        const info = await  npm.repo(i).package();
        devDependencies[i] = `^${info.version}`
    }

    return devDependencies

    // const eslintConfigTongdun = await npm.repo('eslint-config-tongdun').package();
    // const eslintPluginTdRulesPlugin = await npm.repo('eslint-plugin-td-rules-plugin').package();
    // const lintStaged = await npm.repo('lint-staged').package();
    // const commitlintCli = await npm.repo('@commitlint/cli').package();
    // const commitlintConfigConventional = await npm.repo('@commitlint/config-conventional').package();
    // const commitizen = await npm.repo('commitizen').package();
    // const czCustomizable = await npm.repo('cz-customizable').package();
    // const czConventionalChangelog = await npm.repo('cz-conventional-changelog').package();
    
	// const obj = {
	// 	...devDependencies,
	// 	"eslint": "^8.13.0",
	// 	"eslint-config-tongdun": `^${eslintConfigTongdun.version}`,
	// 	"eslint-plugin-td-rules-plugin": `^${eslintPluginTdRulesPlugin.version}`,
	// }

	// obj["lint-staged"] = `^${lintStaged.version}`
    // obj['@commitlint/cli'] = `^${commitlintCli.version}`
    // obj['@commitlint/config-conventional'] = `^${commitlintConfigConventional.version}`
	// obj["commitizen"] = `^${commitizen.version}`
    // obj["cz-customizable"] = `^${czCustomizable.version}`
	// obj["cz-conventional-changelog"] = `^${czConventionalChangelog.version}`
	// obj["husky"] = "^7.0.4"

	// return obj
}

module.exports = {
    getScripts,
    getDependencies,
    getDevDependencies
}
