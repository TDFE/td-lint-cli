/*
 * @Descripttion: 获取package-lock.json 下的所有node_modules/xx
 * @Author: 郑泳健
 * @Date: 2025-11-25 18:35:59
 * @LastEditors: 郑泳健
 * @LastEditTime: 2025-11-26 20:07:17
 */
const Arborist = require('@npmcli/arborist');

const getParentNodeModules = (str) => {
    const parts = str.split('/');

    // 找出所有出现 node_modules 的索引
    const indexes = parts.reduce((acc, part, idx) => {
        if (part === 'node_modules') acc.push(idx);
        return acc;
    }, []);

    // 如果只出现一次，直接返回
    if (indexes.length <= 1) return 'node_modules';

    // 返回倒数第二个 node_modules 的路径片段
    const secondLastIndex = indexes[indexes.length - 2];
    return parts.slice(0, secondLastIndex + 1).join('/');
};

const getPackageVersion = (prefix, packageName, mapLock) => {
    const currentKey = `${prefix}/${packageName}`;
    const item = mapLock[currentKey];
    if (item) {
        return { prefix: currentKey, version: item['version'] };
    }

    const newPreFix = getParentNodeModules(prefix);

    return getPackageVersion(newPreFix, packageName, mapLock);
};

const buildLockTree = (prefix, mapLock, parentPath = []) => {
    const { dependencies, version } = mapLock[prefix];
    let newObj = {
        version
    };
    if (!dependencies) {
        return newObj;
    }

    for (let i in dependencies) {
        if (parentPath.includes(i)) {
            return {};
        }
        const { prefix: newPreFix } = getPackageVersion(`${prefix}/node_modules`, i, mapLock);
        if (newObj['dependencies']) {
            newObj['dependencies'][i] = buildLockTree(newPreFix, mapLock, [...parentPath, i]);
        } else {
            newObj['dependencies'] = {
                [i]: buildLockTree(newPreFix, mapLock, [...parentPath, i])
            };
        }
    }
    return newObj;
};

module.exports = async () => {
    const arborist = new Arborist({ path: process.cwd() });

    // 构建理想树（ideal tree），相当于运行 npm install 后的状态
    const idealTree = await arborist.buildIdealTree({
        // 如果你希望基于当前 node_modules 而不是重新计算，可以设置 add: false
        // 但通常为了生成 lockfile，我们希望“干净”地构建
        add: [], // 不添加新包
        rm: [], // 不移除包
        workspacesEnabled: true
    });
    const lockfileData = idealTree.meta.toJSON();

    const { packages } = lockfileData;
    const dependencies = packages['']['dependencies'];

    let obj = {};
    for (let i in dependencies) {
        obj[i] = buildLockTree(`node_modules/${i}`, packages, []);
    }

    return obj;
};
