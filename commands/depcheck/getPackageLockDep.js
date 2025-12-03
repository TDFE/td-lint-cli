/*
 * @Descripttion: 获取package-lock.json 下的所有node_modules/xx
 * @Author: 郑泳健
 * @Date: 2025-11-25 18:35:59
 * @LastEditors: 郑泳健
 * @LastEditTime: 2025-12-03 19:49:42
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Arborist = require('@npmcli/arborist');

function getPackageLockContent() {
    const originalCwd = process.cwd();
    const tempDir = fs.mkdtempSync(path.join(__dirname, 'npm-lock-'));

    try {
        // 复制 package.json 到临时目录
        const pkgJsonPath = path.resolve(originalCwd, 'package.json');

        if (!fs.existsSync(pkgJsonPath)) {
            throw new Error('当前目录缺少 package.json');
        }
        const str = fs.readFileSync(pkgJsonPath, 'utf8');
        const obj = JSON.parse(str);
        delete obj.scripts?.prepare;

        fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(obj), 'utf8');

        // 在临时目录执行 npm install --package-lock-only
        execSync('npm install --package-lock-only --legacy-peer-deps', {
            cwd: tempDir,
            stdio: 'pipe'
        });

        // 读取生成的 package-lock.json
        const lockContent = fs.readFileSync(path.join(tempDir, 'package-lock.json'), 'utf8');
        return JSON.parse(lockContent); // 返回解析后的对象，或直接返回字符串
    } finally {
        // 清理临时目录（可选：Node.js 退出时自动删除）
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {
            console.warn('清理临时目录失败:', e.message);
        }
        process.chdir(originalCwd); // 恢复工作目录（如果需要）
    }
}

module.exports = async () => {
    let lockfileData = {};
    try {
        const arborist = new Arborist({ path: process.cwd() });

        // 构建理想树（ideal tree），相当于运行 npm install 后的状态
        const idealTree = await arborist.buildIdealTree({
            // 如果你希望基于当前 node_modules 而不是重新计算，可以设置 add: false
            // 但通常为了生成 lockfile，我们希望“干净”地构建
            add: [], // 不添加新包
            rm: [], // 不移除包
            workspacesEnabled: true
        });
        lockfileData = idealTree.meta.toJSON();
    } catch (err) {
        lockfileData = getPackageLockContent();
    }

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
