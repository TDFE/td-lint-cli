#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const ora = require('ora');
const { buildDependencyGraph, findRouterFile, extractRouteMeta } = require('./depChain.js');
const validatorTrace = require('./validatorTrace.js');

const spinner = ora('Loading undead unicorns');
/**
 * 加载 .octopus/zh-CN 翻译（支持目录或单文件）
 */
function flatObject(obj, prefix = '', result = {}) {
    if (!obj || typeof obj !== 'object') return result;
    Object.entries(obj).forEach(([key, value]) => {
        const sumKey = prefix ? prefix + '.' + key : key;
        if (!value || typeof value !== 'object') {
            result[sumKey] = value;
        }
        flatObject(value, sumKey, result);
    });
    return result;
}

function loadZhCNTranslations(projectRoot) {
    const zhCNDir = path.join(projectRoot, '.octopus', 'zh-CN');
    if (!fs.existsSync(zhCNDir) || !fs.statSync(zhCNDir).isDirectory()) return {};

    const langMap = {};
    const indexNames = ['index.js', 'index.jsx', 'index.ts', 'index.tsx'];

    for (const file of fs.readdirSync(zhCNDir)) {
        if (indexNames.includes(file)) continue;
        if (!['.js', '.ts', '.jsx', '.tsx'].some((ext) => file.endsWith(ext))) continue;

        const filePath = path.join(zhCNDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const match = content.match(/export\s*default\s*(\{[\s\S]+);?\s*$/);
            if (!match) continue;
            // eslint-disable-next-line no-eval
            const obj = eval('(' + match[1].replace(/;\s*$/, '') + ')');
            const prefix = file.split('.')[0];
            langMap[prefix] = obj;
        } catch {}
    }

    return flatObject(langMap);
}

/**
 * 从路由 name 字段值中提取 I18N key，并查找对应中文
 * 支持: I18N.get('key')  I18N.t('key')  formatMessage({id:'key'})  'plain string'
 */
function resolvePageName(nameValue, translations) {
    if (!nameValue) return null;

    // I18N.get('key') 或 I18N.t('key') 等函数调用形式
    const fnMatch = nameValue.match(/I18N\.\w+\s*\(\s*['"]([^'"]+)['"]/);
    if (fnMatch) return translations[fnMatch[1]] || fnMatch[1];

    // I18N.workspace.otp.yue12 属性访问形式，去掉 I18N. 前缀作为 key
    const propMatch = nameValue.match(/^I18N\.([a-zA-Z0-9_.]+)/);
    if (propMatch) return translations[propMatch[1]] || propMatch[1];

    // formatMessage({ id: 'key' })
    const fmtMatch = nameValue.match(/formatMessage\s*\(\s*\{\s*id\s*:\s*['"]([^'"]+)['"]/);
    if (fmtMatch) return translations[fmtMatch[1]] || fmtMatch[1];

    // 普通字符串
    const plainMatch = nameValue.match(/^['"]([^'"]+)['"]$/);
    if (plainMatch) return plainMatch[1];

    return null;
}

/**
 * 从 src/common/config 目录读取 routerPrefix
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
        const content = fs.readFileSync(file, 'utf-8');
        const m = content.match(/routerPrefix\s*:\s*['"`]([^'"`]+)['"`]/);
        if (m) return m[1];
    }
    return '';
}

/**
 * 用 webpack 依赖图构建反向映射：file → Set<被哪些文件引用>
 */
function buildReverseMap(depMap) {
    const reverseMap = new Map();
    for (const [file, deps] of depMap.entries()) {
        for (const dep of deps) {
            if (!reverseMap.has(dep)) reverseMap.set(dep, new Set());
            reverseMap.get(dep).add(file);
        }
    }
    return reverseMap;
}

/**
 * 从 startFile 出发，通过反向图 BFS 向上追溯到 routerFile，返回所有路径
 * 每条路径格式：[routerFile, ..., startFile]
 */
function traceUpToRouter(reverseMap, startFile, routerFile, maxPaths = 200) {
    const result = [];
    const routerAbs = path.resolve(routerFile);

    // BFS：队列中每项是当前路径（从 startFile 向上追溯）
    const queue = [[path.resolve(startFile)]];

    while (queue.length > 0 && result.length < maxPaths) {
        const currentPath = queue.shift();
        const head = currentPath[0];

        const parents = reverseMap.get(head);
        if (!parents || parents.size === 0) {
            // 没有父节点，无法到达 router，丢弃
            continue;
        }

        for (const parent of parents) {
            const parentAbs = path.resolve(parent);

            // 防止循环
            if (currentPath.includes(parentAbs)) continue;

            const newPath = [parentAbs, ...currentPath];

            if (parentAbs === routerAbs) {
                // 到达 router，记录这条完整路径
                result.push(newPath);
            } else {
                queue.push(newPath);
            }
        }
    }

    return result;
}

function buildPageLink(pageName, routePath, routerPrefix, esc) {
    const label = `<span class="page-badge">${esc(pageName)}</span>`;
    if (!routePath) return label;
    const prefix = routerPrefix.replace(/\/$/, '');
    const rp = routePath.startsWith('/') ? routePath : '/' + routePath;
    const fullPath = `${prefix}${rp}`;
    return `<span>${label}<button class="page-link" onclick="copyToClipboard(this, '${esc(
        fullPath.replace(/'/g, '\\\'')
    )}')">复制路径</button></span>`;
}

/**
 * 生成 HTML 表格报告
 * 列：每个结果项；行1=chain最后一个文件，行2=pageName，行3=完整依赖链
 */
function generateHtml(items, routerPrefix) {
    const esc = (s) =>
        String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    // 按 pageName 统计改造点数量
    const pageCountMap = new Map();
    for (const item of items) {
        const key = item.pageName || '(未知页面)';
        pageCountMap.set(key, (pageCountMap.get(key) ?? 0) + 1);
    }

    // 计算每个 lastFile 的 rowspan（连续相同的合并）
    const rows = items.map((item) => ({
        lastFile: item.chain[item.chain.length - 1] ?? '',
        pageName: item.pageName,
        routePath: item.routePath,
        chain: item.chain
    }));

    const rowsHtml = rows
        .map((row, i) => {
            const isSameAsPrev = i > 0 && rows[i - 1].lastFile === row.lastFile;
            let fileCell = '';
            if (!isSameAsPrev) {
                let span = 1;
                while (i + span < rows.length && rows[i + span].lastFile === row.lastFile) span++;
                const spanAttr = span > 1 ? ` rowspan="${span}"` : '';
                fileCell = `<td class="file"${spanAttr} title="${esc(row.lastFile)}">${esc(
                    row.lastFile
                )}<button class="copy-btn" onclick="copyToClipboard(this, '${esc(row.lastFile.replace(/'/g, "\\'"))}')">复制</button></td>`;
            }
            const chainHtml = row.chain
                .map((f, idx) => {
                    const cls = idx === 0 ? 'path entry' : idx === row.chain.length - 1 ? 'path tail' : 'path';
                    return `<div class="${cls}">${esc(f)}</div>`;
                })
                .join('');
            return `<tr>
      ${fileCell}
      <td class="page">${buildPageLink(row.pageName, row.routePath, routerPrefix, esc)}</td>
      <td class="chain">${chainHtml}</td>
    </tr>`;
        })
        .join('\n    ');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>改造点分析报告</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 40px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    background: #f0f2f5;
    color: #1a1a2e;
  }
  h2 {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 24px;
    color: #1a1a2e;
    letter-spacing: -0.3px;
  }

  /* 总结卡片 */
  .summary {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 28px;
  }
  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 18px 24px;
    box-shadow: 0 1px 4px rgba(0,0,0,.08);
    min-width: 160px;
  }
  .stat-card .label { font-size: 12px; color: #888; margin-bottom: 6px; }
  .stat-card .value { font-size: 28px; font-weight: 700; color: #3b5bdb; }
  .stat-card .unit  { font-size: 13px; color: #555; margin-left: 4px; }

  /* 页面列表 */
  .page-list {
    background: #fff;
    border-radius: 12px;
    padding: 20px 24px;
    box-shadow: 0 1px 4px rgba(0,0,0,.08);
    margin-bottom: 28px;
  }
  .page-list h3 { margin: 0 0 14px; font-size: 14px; color: #444; font-weight: 600; }
  .page-tags { display: flex; flex-wrap: wrap; gap: 10px; }
  .page-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f0f4ff;
    border: 1px solid #c5d3f8;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
  }
  .page-tag .tag-name { color: #3b5bdb; font-weight: 600; }
  .page-tag .tag-count {
    background: #3b5bdb;
    color: #fff;
    border-radius: 10px;
    padding: 1px 7px;
    font-size: 11px;
    font-weight: 700;
  }

  /* 表格 */
  .table-wrap {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,.08);
    overflow: hidden;
  }
  table { border-collapse: collapse; width: 100%; }
  thead tr { background: #3b5bdb; }
  th {
    padding: 12px 16px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  td {
    padding: 10px 16px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: top;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: #f7f9ff; }

  td.file {
    font-family: 'SF Mono', Consolas, monospace;
    font-size: 12px;
    color: #c0392b;
    font-weight: 600;
    white-space: nowrap;
    width: 20%;
    max-width: 20%;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
  }
  .copy-btn {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: #e0e0e0;
    border: none;
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 10px;
    cursor: pointer;
    color: #555;
  }
  .copy-btn:hover { background: #ccc; }
  .copy-btn.copied { background: #4caf50; color: #fff; }
  td.page {
    white-space: nowrap;
    font-weight: 700;
    font-size: 13px;
  }
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
  .page-badge {
    display: inline-block;
    background: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #a5d6a7;
    border-radius: 6px;
    padding: 2px 10px;
    font-size: 12px;
  }
  td.chain {
    font-family: 'SF Mono', Consolas, monospace;
    font-size: 11.5px;
  }
  .path {
    padding: 2px 0;
    color: #555;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .path::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ccc;
    flex-shrink: 0;
  }
  .path.entry { color: #3b5bdb; font-weight: 600; }
  .path.entry::before { background: #3b5bdb; }
  .path.tail { color: #c0392b; font-weight: 600; }
  .path.tail::before { background: #c0392b; }
</style>
</head>
<body>
<h2>改造点分析报告</h2>

<div class="summary">
  <div class="stat-card">
    <div class="label">影响页面</div>
    <div class="value">${pageCountMap.size}<span class="unit">个</span></div>
  </div>
  <div class="stat-card">
    <div class="label">改造点合计</div>
    <div class="value">${items.length}<span class="unit">处</span></div>
  </div>
</div>

<div class="page-list">
  <h3>页面明细</h3>
  <div class="page-tags">
    ${[...pageCountMap.entries()]
        .map(
            ([name, count]) =>
                `<span class="page-tag"><span class="tag-name">${esc(name)}</span><span class="tag-count">${count}</span></span>`
        )
        .join('\n    ')}
  </div>
</div>

<div class="table-wrap">
<table>
  <thead>
    <tr>
      <th>改造文件</th><th>页面名称</th><th>依赖链</th>
    </tr>
  </thead>
  <tbody>
    ${rowsHtml}
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

/**
 * 主函数：从 validatorTrace 结果出发，反向追溯到 router 文件
 */
module.exports = async function (options) {
    const projectRoot = process.cwd();
    const baseDir = options?.dir || path.join(projectRoot, 'src');
    const validatorNames = ['validatorName', 'getValidatorNameReg', 'getValidatorNameMsg'];
    spinner.start('执行完成后会在根目录下生成html页面，具体可查看该页面');

    // 收集所有 validator 的结果
    let allValidatorFiles = [];
    for (const validatorName of validatorNames) {
        const result = await validatorTrace({
            json: true,
            validator: validatorName,
            dir: baseDir
        });
        if (result && result.length > 0) {
            allValidatorFiles = allValidatorFiles.concat(result.map((item) => ({ ...item, validatorName })));
        }
    }

    if (allValidatorFiles.length === 0) {
        spinner.stop('✅ 未找到任何使用 validator 的文件');
        return [];
    }

    const validatorFiles = allValidatorFiles.map((item) => path.resolve(projectRoot, item.sourceFile));

    const depMap = await buildDependencyGraph(projectRoot);
    const reverseMap = buildReverseMap(depMap);

    // 3. 找到 router 文件，并构建「组件绝对路径 → entryPage 字符串」映射
    const routerFile = findRouterFile(baseDir);
    if (!routerFile) {
        spinner.stop('❌ 未找到路由配置文件');
        return [];
    }

    // 加载 zh-CN 翻译
    const translations = loadZhCNTranslations(projectRoot);

    // 从 router.js 提取路由元信息（component 路径 + name 字段）
    const routeMetas = extractRouteMeta(routerFile);
    const entryPageMap = new Map(); // absoluteComponentPath → { entryPage, pageName }

    for (const { component, name, routePath } of routeMetas) {
        const candidates = [
            path.resolve(path.dirname(routerFile), component),
            path.resolve(path.dirname(routerFile), component + '.js'),
            path.resolve(path.dirname(routerFile), component + '.jsx'),
            path.resolve(path.dirname(routerFile), component, 'index.js'),
            path.resolve(path.dirname(routerFile), component, 'index.jsx')
        ];

        for (const c of candidates) {
            if (depMap.has(c)) {
                entryPageMap.set(c, { entryPage: component, pageName: resolvePageName(name, translations), routePath });
                break;
            }
        }
    }

    const seen = new Set();
    const result = [];

    for (const validatorFile of validatorFiles) {
        const chains = traceUpToRouter(reverseMap, validatorFile, routerFile);
        for (const chain of chains) {
            const key = chain.join('|');
            if (!seen.has(key)) {
                seen.add(key);
                const [routerAbs, directChild, ...rest] = chain;
                const meta = entryPageMap.get(directChild);
                const entryPage = meta?.entryPage || path.relative(projectRoot, directChild);
                const pageName = meta?.pageName || null;
                const routePath = meta?.routePath || null;
                result.push({
                    pageName,
                    routePath,
                    entryPath: entryPage,
                    chain: [path.relative(projectRoot, directChild), ...rest.map((f) => path.relative(projectRoot, f))]
                });
            }
        }
    }

    // 过滤：A=链头（entryPage），B=链尾（validator 文件）
    // c = A 的第3段（页面名），d = B 的第2段（目录类型），e = B 的第3段（页面名）
    // d 不属于 pages/routes → 保留（validator 在公共目录）
    // d 属于 pages/routes  → c 与 e 一致时保留（validator 属于不同页面）
    const filtered = result.filter((item) => {
        const A = item.entryPath;
        const B = item.chain[item.chain.length - 1];
        const c = A.split('/')[2];
        const d = B.split('/')[1];
        const e = B.split('/')[2];
        if (!['pages', 'routes'].includes(d)) return true;
        return c?.toLowerCase() === e?.toLowerCase();
    });

    // console.log(`   共计 ${filtered.length} 个改造点\n`);
    const routerPrefix = readRouterPrefix(projectRoot);
    const htmlPath = path.join(projectRoot, 'result-regex.html');
    fs.writeFileSync(htmlPath, generateHtml(filtered, routerPrefix), 'utf-8');
    spinner.succeed(`📄 HTML 已写入: ${htmlPath}`);

    return filtered;
};
