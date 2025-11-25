/*
 * @Descripttion: 获取package-lock.json 下的所有node_modules/xx
 * @Author: 郑泳健
 * @Date: 2025-11-25 18:35:59
 * @LastEditors: 郑泳健
 * @LastEditTime: 2025-11-25 18:47:48
 */
const path = require('path');
const fs = require('fs');

module.exports = () => {
    const packageJsonLock = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './package-lock.json'), 'utf-8'));
    const { packages } = packageJsonLock;

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
