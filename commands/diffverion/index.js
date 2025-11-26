#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const getPackageLockDep = require('./getPackageLockDep');
const getPnpmPackageLockDep = require('./getPnpmPackageLockDep');

const spinner = ora('Loading undead unicorns');

const resolve = (dir) => path.resolve(process.cwd(), dir);

function diffJson(json1, json2) {
    const result = {
        onlyNpm: [],
        onlyPnpm: [],
        versionDiff: []
    };

    function compare(obj1, obj2, path = '') {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        // 找只在 obj1 的键
        for (const key of keys1) {
            if (!keys2.includes(key)) {
                result.onlyNpm.push(path ? `${path}.${key}` : key);
            } else {
                const val1 = obj1[key];
                const val2 = obj2[key];

                if (
                    typeof val1 === 'object' &&
                    val1 !== null &&
                    typeof val2 === 'object' &&
                    val2 !== null &&
                    !Array.isArray(val1) &&
                    !Array.isArray(val2)
                ) {
                    // 递归对象
                    compare(val1, val2, path ? `${path}.${key}` : key);
                } else if (Array.isArray(val1) && Array.isArray(val2)) {
                    // 数组比较，简单按值比较
                    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
                        result.versionDiff.push({
                            key: path ? `${path}.${key}` : key,
                            pnpm: val1,
                            npm: val2
                        });
                    }
                } else if (val1 !== val2) {
                    result.versionDiff.push({
                        key: path ? `${path}.${key}` : key,
                        pnpm: val1,
                        npm: val2
                    });
                }
            }
        }

        // 找只在 obj2 的键
        for (const key of keys2) {
            if (!keys1.includes(key)) {
                result.onlyPnpm.push(path ? `${path}.${key}` : key);
            }
        }
    }

    compare(json1, json2);
    return result;
}

module.exports = async function () {
    spinner.start('🚀 开始对比\n');
    try {
        const hasLockfile = fs.existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'));

        if (!hasLockfile) {
            spinner.end('请先执行pnpm i');
            return;
        }
        const lockFilePath = resolve('pnpm-lock.yaml');
        const fileContent = fs.readFileSync(lockFilePath, 'utf-8');

        const packageLockMap = await getPackageLockDep();
        const pnpmDeps = await getPnpmPackageLockDep(fileContent);
        const result = diffJson(packageLockMap, pnpmDeps);

        fs.writeFileSync(resolve('diff2.js'), JSON.stringify(packageLockMap, null, 2));
        fs.writeFileSync(resolve('diff3.js'), JSON.stringify(pnpmDeps, null, 2));
        fs.writeFileSync(resolve('diff1.js'), JSON.stringify(result, null, 2));
        spinner.succeed('完成对比，具体请在diff.js中查看');
    } catch (err) {
        console.error('对比失败:', err);
        shell.exit(0);
    }
};
