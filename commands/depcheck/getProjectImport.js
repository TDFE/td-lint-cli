/*
 * @Descripttion: 获取项目里面所有的import
 * @Author: 郑泳健
 * @Date: 2025-11-25 18:31:23
 * @LastEditors: 郑泳健
 * @LastEditTime: 2025-11-25 19:58:12
 */
const fs = require('fs');
const path = require('path');

/**
 * 获取指定目录下所有 js 文件
 * @param {string[]} dirs - 要扫描的目录数组
 * @returns {string[]} 所有 js 文件路径
 */
function getAllJsFiles(dirs) {
    let jsFiles = [];

    dirs.forEach((dir) => {
        function traverse(currentPath) {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });
            entries.forEach((entry) => {
                const fullPath = path.join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name === 'node_modules') return;
                    traverse(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.js')) {
                    jsFiles.push(fullPath);
                }
            });
        }

        traverse(dir);
    });

    return jsFiles;
}

/**
 * 提取 js 文件中的 import 来源
 * @param {string[]} files - js 文件路径数组
 * @returns {string[]} import 来源数组
 */
function extractImports(files) {
    const imports = [];

    files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        // 1. 匹配 import xx from 'yy'
        const importFromRegex = /import\s+(?:[\s\S]+?)\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importFromRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        // 2. 匹配 import 'yy' 这种不带 from 的
        const importOnlyRegex = /import\s+['"]([^'"]+)['"]/g;
        while ((match = importOnlyRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
    });

    return imports;
}

module.exports = (dirsToScan) => {
    const jsFiles = getAllJsFiles(dirsToScan);
    const importModules = extractImports(jsFiles);
    return importModules;
};
