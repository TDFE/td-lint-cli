const Npm = require('npm-api')

const npm = new Npm();

/** 重新生成scripts */
function getScripts(scripts) {
	const keys = Object.keys(scripts)
	if(!keys.includes('prepare')) {
		scripts.prepare = "husky install"
	}

    if(!keys.includes('changeLog')) {
        scripts.changeLog = "rm -rf CHANGELOG.md && conventional-changelog -p angular -i CHANGELOG.md -s"
    }

	if(!keys.includes('eslint-fixed')) {
		scripts['eslint-fixed'] = "npx eslint --max-warnings 0 --ext .js,.jsx,.ts,.tsx ./src"
	}

	return scripts
}

/** 重新生成dependencies */
function getDependencies(dependencies) {
	["commitizen", 'cz-customizable', "cz-conventional-changelog", "husky", "lint-staged"].forEach(i => {
		delete dependencies[i]
	})

    for(let key in dependencies) {
		// 删除eslint相关的包
		if(key.includes('eslint')) {
			delete dependencies[key]
		}
	}

	return dependencies
}

/** 重新生成devDependencies */
async function getDevDependencies(devDependencies) {
	for(let key in devDependencies) {
		// 删除eslint相关的包
		if(key.includes('eslint')) {
			delete devDependencies[key]
		}
	}

    const eslintConfigTongdun = await npm.repo('eslint-config-tongdun').package();
    const eslintPluginTdRulesPlugin = await npm.repo('eslint-plugin-td-rules-plugin').package();
    const lintStaged = await npm.repo('lint-staged').package();
    const commitlintCli = await npm.repo('@commitlint/cli').package();
    const commitlintConfigConventional = await npm.repo('@commitlint/config-conventional').package();
    const commitizen = await npm.repo('commitizen').package();
    const czCustomizable = await npm.repo('cz-customizable').package();
    const czConventionalChangelog = await npm.repo('cz-conventional-changelog').package();
    
	const obj = {
		...devDependencies,
		"eslint": "^8.13.0",
		"eslint-config-tongdun": `^${eslintConfigTongdun.version}`,
		"eslint-plugin-td-rules-plugin": `^${eslintPluginTdRulesPlugin.version}`,
	}

	obj["lint-staged"] = `^${lintStaged.version}`
    obj['@commitlint/cli'] = `^${commitlintCli.version}`
    obj['@commitlint/config-conventional'] = `^${commitlintConfigConventional.version}`
	obj["commitizen"] = `^${commitizen.version}`
    obj["cz-customizable"] = `^${czCustomizable.version}`
	obj["cz-conventional-changelog"] = `^${czConventionalChangelog.version}`
	obj["husky"] = "^7.0.4"

	return obj
}

module.exports = {
    getScripts,
    getDependencies,
    getDevDependencies
}
