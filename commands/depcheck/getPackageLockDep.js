/*
 * @Descripttion: 获取package-lock.json 下的所有node_modules/xx
 * @Author: 郑泳健
 * @Date: 2025-11-25 18:35:59
 * @LastEditors: 郑泳健
 * @LastEditTime: 2025-11-26 11:19:55
 */
const Arborist = require('@npmcli/arborist');

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

    let packageLockList = [];

    for (let i in packages) {
        const hasOnlyOne = (i.match(/node_modules/g) || []).length === 1;
        if (hasOnlyOne) {
            const key = i.replace('node_modules/', '');
            packageLockList.push(key);
        }
    }
    return { packageLockList, packageLockMap: packages };
};
