#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const { findRouterFile, extractRouteMeta } = require('../regex/depChain.js');

const spinner = ora('Loading undead unicorns');
// ── 翻译工具（与 regex/index.js 保持一致） ─────────────────────────────────

function flatObject(obj, prefix = '', result = {}) {
    if (!obj || typeof obj !== 'object') return result;
    Object.entries(obj).forEach(([key, value]) => {
        const sumKey = prefix ? prefix + '.' + key : key;
        if (!value || typeof value !== 'object') result[sumKey] = value;
        flatObject(value, sumKey, result);
    });
    return result;
}

function loadZhCNTranslations(projectRoot) {
    const zhCNDir = path.join(projectRoot, '.octopus', 'zh-CN');
    if (!fs.existsSync(zhCNDir) || !fs.statSync(zhCNDir).isDirectory()) return {};
    const indexNames = ['index.js', 'index.jsx', 'index.ts', 'index.tsx'];
    const langMap = {};
    for (const file of fs.readdirSync(zhCNDir)) {
        if (indexNames.includes(file)) continue;
        if (!['.js', '.ts', '.jsx', '.tsx'].some((ext) => file.endsWith(ext))) continue;
        try {
            const content = fs.readFileSync(path.join(zhCNDir, file), 'utf-8');
            const match = content.match(/export\s*default\s*(\{[\s\S]+);?\s*$/);
            if (!match) continue;
            // eslint-disable-next-line no-eval
            const obj = eval('(' + match[1].replace(/;\s*$/, '') + ')');
            langMap[file.split('.')[0]] = obj;
        } catch {}
    }
    return flatObject(langMap);
}

function resolvePageName(nameValue, translations) {
    if (!nameValue) return null;
    const fnMatch = nameValue.match(/I18N\.\w+\s*\(\s*['"]([^'"]+)['"]/);
    if (fnMatch) return translations[fnMatch[1]] || fnMatch[1];
    const propMatch = nameValue.match(/^I18N\.([a-zA-Z0-9_.]+)/);
    if (propMatch) return translations[propMatch[1]] || propMatch[1];
    const fmtMatch = nameValue.match(/formatMessage\s*\(\s*\{\s*id\s*:\s*['"]([^'"]+)['"]/);
    if (fmtMatch) return translations[fmtMatch[1]] || fmtMatch[1];
    const plainMatch = nameValue.match(/^['"]([^'"]+)['"]$/);
    if (plainMatch) return plainMatch[1];
    return null;
}

/**
 * 构建 页面路径段(小写) → { pageName, routePath } 映射
 */
function buildPageNameMap(projectRoot, baseDir) {
    const routerFile = findRouterFile(baseDir);
    if (!routerFile) return new Map();
    const translations = loadZhCNTranslations(projectRoot);
    const map = new Map();
    for (const { component, name, routePath } of extractRouteMeta(routerFile)) {
        const segment = component.split('/').pop();
        if (segment) map.set(segment.toLowerCase(), { pageName: resolvePageName(name, translations) || segment, routePath: routePath || null });
    }
    return map;
}

/**
 * 从文件路径推断所属页面信息 { pageName, routePath }
 */
function getPageName(relFile, pageNameMap) {
    const parts = relFile.split('/');
    const pageIdx = parts.findIndex((p) => p === 'pages' || p === 'routes');
    if (pageIdx >= 0 && parts[pageIdx + 1]) {
        const meta = pageNameMap.get(parts[pageIdx + 1].toLowerCase());
        if (meta) return meta;
        return { pageName: parts[pageIdx + 1], routePath: null };
    }
    return { pageName: null, routePath: null };
}

/**
 * 从 src/common/config 读取 routerPrefix
 */
function readRouterPrefix(projectRoot) {
    const candidates = [
        path.join(projectRoot, 'src', 'common', 'config', 'index.js'),
        path.join(projectRoot, 'src', 'common', 'config', 'index.ts'),
        path.join(projectRoot, 'src', 'common', 'config.js'),
        path.join(projectRoot, 'src', 'common', 'config.ts')
    ];
    for (const file of candidates) {
        if (!fs.existsSync(file)) continue;
        const m = fs.readFileSync(file, 'utf-8').match(/routerPrefix\s*:\s*['"`]([^'"`]+)['"`]/);
        if (m) return m[1];
    }
    return '';
}

function buildPageLink(pageName, routePath, routerPrefix, esc) {
    const label = `<span class="page-badge">${esc(pageName || '未知页面')}</span>`;
    if (!routePath) return label;
    const prefix = routerPrefix.replace(/\/$/, '');
    const rp = routePath.startsWith('/') ? routePath : '/' + routePath;
    const fullPath = `${prefix}${rp}`;
    return `<span>${label}<button class="page-link" onclick="copyToClipboard(this, '${esc(fullPath.replace(/'/g, "\\'"))}')">复制路径</button></span>`;
}

// ── 正则提取 ──────────────────────────────────────────────────────────────

function extractRegexLiterals(source) {
    const results = [];
    let i = 0;
    let lineNum = 1;
    let prevType = 'operator';

    while (i < source.length) {
        const ch = source[i];
        if (ch === '\n') {
            lineNum++;
            i++;
            continue;
        }
        if (ch === ' ' || ch === '\t' || ch === '\r') {
            i++;
            continue;
        }

        if (ch === '/' && source[i + 1] === '/') {
            while (i < source.length && source[i] !== '\n') i++;
            continue;
        }
        if (ch === '/' && source[i + 1] === '*') {
            i += 2;
            while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
                if (source[i] === '\n') lineNum++;
                i++;
            }
            i += 2;
            continue;
        }
        if (ch === '`') {
            i++;
            while (i < source.length && source[i] !== '`') {
                if (source[i] === '\\') i++;
                if (source[i] === '\n') lineNum++;
                i++;
            }
            i++;
            prevType = 'string';
            continue;
        }
        if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            while (i < source.length && source[i] !== quote) {
                if (source[i] === '\\') i++;
                if (source[i] === '\n') lineNum++;
                i++;
            }
            i++;
            prevType = 'string';
            continue;
        }
        if (ch === '/' && prevType !== 'identifier' && prevType !== 'number' && prevType !== 'string' && prevType !== 'close') {
            // JSX 自闭合 />：/ 后紧跟 >，肯定不是正则
            if (source[i + 1] === '>') {
                i += 2;
                prevType = 'close';
                continue;
            }
            const regexLine = lineNum;
            i++;
            let pattern = '';
            let inCharClass = false;
            while (i < source.length) {
                const c = source[i];
                if (c === '\n') break;
                if (c === '\\') {
                    pattern += c + (source[i + 1] || '');
                    i += 2;
                    continue;
                }
                if (c === '[') inCharClass = true;
                if (c === ']') inCharClass = false;
                if (c === '/' && !inCharClass) {
                    i++;
                    break;
                }
                pattern += c;
                i++;
            }
            let flags = '';
            while (i < source.length && /[gimsuy]/.test(source[i])) flags += source[i++];
            if (pattern.length > 0) results.push({ pattern, flags, line: regexLine, display: `/${pattern}/${flags}` });
            prevType = 'close';
            continue;
        }
        if (/\d/.test(ch)) {
            while (i < source.length && /[\d.eExX_a-fA-F]/.test(source[i])) i++;
            prevType = 'number';
            continue;
        }
        if (/[a-zA-Z_$]/.test(ch)) {
            while (i < source.length && /[a-zA-Z0-9_$]/.test(source[i])) i++;
            prevType = 'identifier';
            continue;
        }
        if (ch === ')' || ch === ']' || ch === '}' || ch === '>') {
            prevType = 'close';
            i++;
            continue;
        }
        // JSX 闭合标签 </Tag>：< 后紧跟 /，直接跳到 > 避免误判为正则
        if (ch === '<' && source[i + 1] === '/') {
            while (i < source.length && source[i] !== '>') i++;
            if (i < source.length) i++;
            prevType = 'close';
            continue;
        }
        prevType = 'operator';
        i++;
    }
    return results;
}

function extractNewRegExp(source) {
    const results = [];
    const re = /(?:new\s+RegExp|RegExp)\s*\(\s*(['"`])([\s\S]*?)\1/g;
    let match;
    while ((match = re.exec(source)) !== null) {
        const pattern = match[2];
        if (pattern) {
            const lineNum = source.slice(0, match.index).split('\n').length;
            results.push({ pattern, flags: '', line: lineNum, display: `RegExp("${pattern}")` });
        }
    }
    return results;
}

function hasChinese(str) {
    if (/[\u4e00-\u9fa5\u3400-\u4dbf]/.test(str)) return true;
    if (/[\uD840-\uD868][\uDC00-\uDFFF]/.test(str)) return true;
    const escapes = str.match(/\\u([0-9a-fA-F]{4})/g) || [];
    return escapes.some((e) => {
        const c = parseInt(e.slice(2), 16);
        return (c >= 0x4e00 && c <= 0x9fa5) || (c >= 0x3400 && c <= 0x4dbf);
    });
}

function hasEnglish(str) {
    return /[a-zA-Z]/.test(str);
}

// 正则翻译：将正则模式翻译成中文
function translateRegex(pattern) {
    if (!pattern) return '';
    let result = pattern;

    // 先处理转义字符
    const escapes = {
        '\\d': '数字',
        '\\D': '非数字',
        '\\w': '单词字符',
        '\\W': '非单词字符',
        '\\s': '空白字符',
        '\\S': '非空白字符',
        '\\b': '单词边界',
        '\\B': '非单词边界',
        '\\n': '换行',
        '\\r': '回车',
        '\\t': '制表符',
        '\\.': '点号',
        '\\^': '脱字符',
        '\\$': '美元符',
        '\\*': '星号',
        '\\+': '加号',
        '\\?': '问号',
        '\\|': '或',
        '\\(': '左括号',
        '\\)': '右括号',
        '\\[': '左方括号',
        '\\]': '右方括号',
        '\\{': '左花括号',
        '\\}': '右花括号',
        '\\/': '斜杠',
        '\\\\': '反斜杠',
    };

    for (const [esc, zh] of Object.entries(escapes)) {
        result = result.split(esc).join(zh);
    }

    // 处理字符类 [abc]
    result = result.replace(/\[([^\]]*)\]/g, (_, chars) => {
        return `包含[${chars}]中任意一个`;
    });

    // 处理量词
    result = result.replace(/\*/g, ' (零个或多个)');
    result = result.replace(/\+/g, ' (一个或多个)');
    result = result.replace(/\?/g, ' (零个或一个)');
    result = result.replace(/\{(\d+)(?:,(\d*))?\}/g, (_, a, b) => {
        if (b === undefined) return ` (恰好${a}次)`;
        if (b === '') return ` (至少${a}次)`;
        return ` (${a}到${b}次)`;
    });

    // 处理锚点
    result = result.replace(/\^/g, ' (行首)');
    result = result.replace(/\$/g, ' (行尾)');

    // 处理分组
    result = result.replace(/\(([^)]*)\)/g, (_, group) => {
        if (group.startsWith('?:')) return `非捕获组`;
        if (group.startsWith('?=')) return '正向先行';
        if (group.startsWith('?!')) return '负向先行';
        if (group.startsWith('?<=')) return '正向后行';
        if (group.startsWith('?<!')) return '负向后行';
        return `组${group}`;
    });

    // 处理或 |
    result = result.replace(/\|/g, ' 或 ');

    // 处理点号
    result = result.replace(/\./g, '任意字符');

    return result;
}

function walkDir(dir, extensions) {
    const results = [];
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return results;
    }
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', '.git', 'dist', 'build', '.cache', 'coverage'].includes(entry.name)) continue;
            results.push(...walkDir(fullPath, extensions));
        } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
            results.push(fullPath);
        }
    }
    return results;
}

function printByFile(items) {
    const byFile = new Map();
    for (const m of items) {
        if (!byFile.has(m.file)) byFile.set(m.file, []);
        byFile.get(m.file).push(m);
    }
    for (const [file, list] of byFile) {
        console.log(chalk.cyan(file));
        for (const item of list) console.log(`  ${chalk.gray(`line ${item.line}:`)} ${chalk.magenta(item.display)}`);
        console.log();
    }
}

// ── HTML 生成 ──────────────────────────────────────────────────────────────

function buildTableRows(items, pageNameMap, routerPrefix, esc) {
    const byFile = new Map();
    for (const m of items) {
        if (!byFile.has(m.file)) {
            const { pageName, routePath } = getPageName(m.file, pageNameMap);
            byFile.set(m.file, { pageName, routePath, matches: [] });
        }
        byFile.get(m.file).matches.push(m);
    }
    const rows = [...byFile.entries()]
        .map(([file, { pageName, routePath, matches }]) => ({ file, pageName, routePath, matches }))
        .sort((a, b) => (a.pageName || '').localeCompare(b.pageName || ''));

    const rowsHtml = rows
        .map((row, i) => {
            const isSameAsPrev = i > 0 && rows[i - 1].pageName === row.pageName;
            let pageCell = '';
            if (!isSameAsPrev) {
                let span = 1;
                while (i + span < rows.length && rows[i + span].pageName === row.pageName) span++;
                const spanAttr = span > 1 ? ` rowspan="${span}"` : '';
                pageCell = `<td class="page"${spanAttr}>${buildPageLink(row.pageName, row.routePath, routerPrefix, esc)}</td>`;
            }
            const matchesHtml = row.matches
                .map((m) => {
                    const translation = translateRegex(m.pattern);
                    return `<div class="match"><span class="line">L${m.line}</span><code>${esc(m.display)}</code><span class="translation">${esc(translation)}</span></div>`;
                })
                .join('');
            return `<tr>\n      <td class="file" title="${esc(row.file)}">${esc(row.file)}<button class="copy-btn" onclick="copyToClipboard(this, '${esc(row.file.replace(/'/g, "\\'"))}')">复制</button></td>\n      ${pageCell}\n      <td class="matches">${matchesHtml}</td>\n    </tr>`;
        })
        .join('\n    ');

    return { byFile, rowsHtml };
}

function generateHtml(all, bilingual, pageNameMap, routerPrefix) {
    const esc = (s) =>
        String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    const { byFile: allByFile, rowsHtml: allRowsHtml } = buildTableRows(all, pageNameMap, routerPrefix, esc);
    const { byFile: biByFile, rowsHtml: biRowsHtml } = buildTableRows(bilingual, pageNameMap, routerPrefix, esc);

    // 统计（基于中英文表）
    const pageCountMap = new Map();
    for (const { pageName } of biByFile.values()) {
        const key = pageName || '(未知页面)';
        pageCountMap.set(key, (pageCountMap.get(key) ?? 0) + 1);
    }

    const pageTagsHtml = [...pageCountMap.entries()]
        .map(
            ([name, count]) =>
                `<span class="page-tag"><span class="tag-name">${esc(name)}</span><span class="tag-count">${count}</span></span>`
        )
        .join('\n    ');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>正则分析报告</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 32px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; background: #f0f2f5; color: #1a1a2e; }
  h2 { font-size: 22px; font-weight: 700; margin: 0 0 24px; color: #1a1a2e; letter-spacing: -0.3px; }
  h3.section-title { font-size: 16px; font-weight: 700; margin: 32px 0 14px; color: #1a1a2e; padding-left: 10px; border-left: 4px solid #3b5bdb; }
  h3.section-title.bilingual { border-left-color: #e03131; }

  .summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
  .stat-card { background: #fff; border-radius: 12px; padding: 18px 24px; box-shadow: 0 1px 4px rgba(0,0,0,.08); min-width: 160px; }
  .stat-card .label { font-size: 12px; color: #888; margin-bottom: 6px; }
  .stat-card .value { font-size: 28px; font-weight: 700; color: #3b5bdb; }
  .stat-card .value.red { color: #e03131; }
  .stat-card .unit { font-size: 13px; color: #555; margin-left: 4px; }

  .page-list { background: #fff; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-bottom: 28px; }
  .page-list h4 { margin: 0 0 14px; font-size: 14px; color: #444; font-weight: 600; }
  .page-tags { display: flex; flex-wrap: wrap; gap: 10px; }
  .page-tag { display: inline-flex; align-items: center; gap: 6px; background: #f0f4ff; border: 1px solid #c5d3f8; border-radius: 20px; padding: 4px 12px; font-size: 12px; }
  .page-tag .tag-name { color: #3b5bdb; font-weight: 600; }
  .page-tag .tag-count { background: #3b5bdb; color: #fff; border-radius: 10px; padding: 1px 7px; font-size: 11px; font-weight: 700; }

  .table-wrap { background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden; margin-bottom: 8px; }
  table { border-collapse: collapse; width: 100%; }
  thead tr { background: #3b5bdb; }
  thead tr.red { background: #e03131; }
  th { padding: 12px 16px; color: #fff; font-size: 12px; font-weight: 600; text-align: left; letter-spacing: 0.4px; text-transform: uppercase; }
  td { padding: 10px 16px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: #f7f9ff; }

  td.file { font-family: 'SF Mono', Consolas, monospace; font-size: 12px; color: #555; width: 20%; max-width: 20%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; position: relative; }
  .copy-btn { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: #e0e0e0; border: none; border-radius: 3px; padding: 2px 6px; font-size: 10px; cursor: pointer; color: #555; }
  .copy-btn:hover { background: #ccc; }
  .copy-btn.copied { background: #4caf50; color: #fff; }
  td.page { white-space: nowrap; }
  .page-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; border-radius: 6px; padding: 2px 10px; font-size: 12px; font-weight: 700; }
  .page-link {
    background: #e0e0e0;
    border: none;
    border-radius: 3px;
    padding: 2px 8px;
    font-size: 11px;
    cursor: pointer;
    color: #555;
    margin-left: 6px;
  }
  .page-link:hover { background: #ccc; }
  .page-link.copied { background: #4caf50; color: #fff; }
  td.matches { font-family: 'SF Mono', Consolas, monospace; font-size: 12px; }
  .match { display: flex; align-items: baseline; gap: 8px; padding: 3px 0; border-bottom: 1px dashed #f0f0f0; }
  .match:last-child { border-bottom: none; }
  .match .line { color: #aaa; font-size: 11px; white-space: nowrap; min-width: 36px; }
  .match code { color: #c0392b; background: #fff5f5; border-radius: 4px; padding: 1px 6px; word-break: break-all; }
  .match .translation { color: #666; font-size: 11px; margin-left: 8px; white-space: nowrap; }
</style>
</head>
<body>
<h2>正则分析报告</h2>

<div class="summary">
  <div class="stat-card">
    <div class="label">全部正则</div>
    <div class="value">${all.length}<span class="unit">处</span></div>
  </div>
  <div class="stat-card">
    <div class="label">涉及文件</div>
    <div class="value">${allByFile.size}<span class="unit">个</span></div>
  </div>
  <div class="stat-card">
    <div class="label">中英文混合</div>
    <div class="value red">${bilingual.length}<span class="unit">处</span></div>
  </div>
  <div class="stat-card">
    <div class="label">影响页面</div>
    <div class="value red">${pageCountMap.size}<span class="unit">个</span></div>
  </div>
</div>

<div class="page-list">
  <h4>中英文混合正则 — 页面明细</h4>
  <div class="page-tags">
    ${pageTagsHtml}
  </div>
</div>

<h3 class="section-title bilingual">中英文混合正则（${bilingual.length} 处）</h3>
<div class="table-wrap">
<table>
  <thead><tr class="red"><th>文件</th><th>页面名称</th><th>正则</th><th>翻译</th></tr></thead>
  <tbody>
    ${biRowsHtml}
  </tbody>
</table>
</div>

<h3 class="section-title">全部正则（${all.length} 处）</h3>
<div class="table-wrap">
<table>
  <thead><tr><th>文件</th><th>页面名称</th><th>正则</th><th>翻译</th></tr></thead>
  <tbody>
    ${allRowsHtml}
  </tbody>
</table>
</div>

<script>
function copyToClipboard(btn, text) {
    navigator.clipboard.writeText(text).then(function() {
        btn.textContent = '已复制';
        btn.classList.add('copied');
        setTimeout(function() {
            btn.textContent = '复制';
            btn.classList.remove('copied');
        }, 1500);
    }, function(err) {
        console.error('复制失败: ', err);
    });
}
</script>

</body>
</html>`;
}

// ── 主函数 ────────────────────────────────────────────────────────────────

module.exports = async function (options) {
    const projectRoot = process.cwd();
    const targetDir = options?.dir ? path.resolve(projectRoot, options.dir) : path.join(projectRoot, 'src');
    const baseDir = path.join(projectRoot, 'src');
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue'];
    spinner.start('执行完成后会在根目录下生成html页面，具体可查看该页面');
    if (!fs.existsSync(targetDir)) {
        spinner.stop(chalk.red(`❌ 目录不存在: ${targetDir}`));
        process.exit(1);
    }

    const pageNameMap = buildPageNameMap(projectRoot, baseDir);

    const files = walkDir(targetDir, extensions);
    const all = [];

    for (const file of files) {
        let source;
        try {
            source = fs.readFileSync(file, 'utf-8');
        } catch {
            continue;
        }
        const relFile = path.relative(projectRoot, file);
        for (const item of extractRegexLiterals(source)) all.push({ ...item, file: relFile });
        for (const item of extractNewRegExp(source)) all.push({ ...item, file: relFile });
    }

    if (all.length === 0) {
        spinner.stop(chalk.green('✅ 未找到任何正则表达式'));
        // 仍然生成空报告 HTML
        const routerPrefix = readRouterPrefix(projectRoot);
        const htmlPath = path.join(projectRoot, 'regex.html');
        fs.writeFileSync(htmlPath, generateHtml(all, [], pageNameMap, routerPrefix), 'utf-8');
        spinner.succeed(chalk.green(`\n📄 HTML 已写入: ${htmlPath}`));
        return { all: [], bilingual: [] };
    }

    const bilingual = all.filter((m) => hasChinese(m.pattern) && hasEnglish(m.pattern));

    const routerPrefix = readRouterPrefix(projectRoot);
    const htmlPath = path.join(projectRoot, 'regex.html');
    fs.writeFileSync(htmlPath, generateHtml(all, bilingual, pageNameMap, routerPrefix), 'utf-8');
    spinner.succeed(chalk.green(`\n📄 HTML 已写入: ${htmlPath}`));

    return { all, bilingual };
};
