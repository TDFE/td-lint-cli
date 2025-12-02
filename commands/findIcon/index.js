#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const ora = require('ora');
const { compareTwoStrings } = require('string-similarity');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const getNpmInfo = require('./getNpmInfo');
const spinner = ora('Loading undead unicorns');

const resolve = (dir) => path.resolve(process.cwd(), dir);

const SIMILARITY_THRESHOLD = 0.9;

// 标准化 SVG 内容：移除无关信息，统一格式
function normalizeSvg(content) {
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            removeNSPrefix: true,
            parseTagValue: false,
            parseAttributeValue: false,
            trimValues: true
        });

        const parsed = parser.parse(content);

        // 可选：删除 title, desc, metadata 等非图形元素
        const clean = (obj) => {
            if (typeof obj !== 'object' || obj === null) return obj;
            if (Array.isArray(obj)) return obj.map(clean);
            const result = {};
            for (const key in obj) {
                if (!['title', 'desc', 'metadata', 'defs'].includes(key.toLowerCase())) {
                    result[key] = clean(obj[key]);
                }
            }
            return result;
        };

        const cleaned = clean(parsed);

        // 重新序列化为字符串（紧凑格式）
        const builder = new XMLBuilder({
            format: false,
            ignoreAttributes: false,
            suppressEmptyNode: true
        });
        return builder.build(cleaned).replace(/\s+/g, ' ').trim();
    } catch (e) {
        // 如果解析失败，回退到纯文本清理
        console.warn('XML 解析失败，使用原始文本清理:', e.message);
        return content
            .replace(/<!--[\s\S]*?-->/g, '') // 移除注释
            .replace(/\s+/g, ' ') // 合并空白
            .replace(/>\s+</g, '><') // 去除标签间空格
            .trim();
    }
}

module.exports = async function () {
    try {
        spinner.start('🚀 正在匹配icon名中');
        const targetContent = fs.readFileSync(resolve('target.svg'), 'utf-8');
        const normalizedTarget = normalizeSvg(targetContent);
        // 使用
        getNpmInfo('@tntd/icons').then((svgs) => {
            const results = [];

            for (const key in svgs) {
                try {
                    const content = svgs[key];
                    const normalized = normalizeSvg(content);
                    const similarity = compareTwoStrings(normalizedTarget, normalized);
                    if (similarity >= SIMILARITY_THRESHOLD) {
                        results.push({ file: key, similarity });
                    }
                } catch (err) {
                    console.warn(`跳过文件 ${key}:`, err.message);
                }
            }
            // 按相似度降序排序
            results.sort((a, b) => b.similarity - a.similarity);

            // 输出结果
            if (results.length === 0) {
                spinner.stop(`未找到相似度 ≥${SIMILARITY_THRESHOLD * 100}% 的 SVG 文件。`);
            } else {
                console.log(`找到 ${results.length} 个相似度 ≥${SIMILARITY_THRESHOLD * 100}% 的文件：`);
                results.forEach(({ file, similarity }) => {
                    let key = file;
                    const arr = file?.split('/');
                    if (Array.isArray(arr) && arr.length) {
                        key = arr[arr.length - 1].replace('.svg', '');
                    }
                    console.log(`${key}: ${(similarity * 100).toFixed(2)}%`);
                });

                spinner.succeed('😄 查询完成');
                shell.exit(0);
            }
        });
    } catch (error) {
        console.log(error);
        shell.exit(1);
    }
};
