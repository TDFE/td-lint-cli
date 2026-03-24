const webpack = require('webpack');
const merge = require('webpack-merge');
const fs = require('fs');
const path = require('path');

const ROUTER_FILENAMES = ['router.js', 'router.ts', 'routes.js', 'routes.ts'];

function findRouterFile(baseDir) {
    for (const filename of ROUTER_FILENAMES) {
        const filePath = path.join(baseDir, filename);
        if (fs.existsSync(filePath)) return filePath;
    }
    return null;
}

function extractRoutePages(routerPath) {
    const content = fs.readFileSync(routerPath, 'utf-8');
    const pages = [];
    const dynamicImportRegex =
        /component:\s*dynamic\s*\(\s*\{[^}]*component:\s*\(\)\s*=>\s*import\s*\(\s*['"](\.+[/a-zA-Z0-9_-]+)['"]\s*\)/g;
    let match;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
        pages.push(match[1]);
    }
    return pages;
}

/**
 * 解析 router.js，返回 [{component, name}]，name 是路由配置中的 name 字段原始值
 */
function extractRouteMeta(routerPath) {
    const content = fs.readFileSync(routerPath, 'utf-8');
    const routes = [];
    const dynamicImportRegex =
        /component:\s*dynamic\s*\(\s*\{[^}]*component:\s*\(\)\s*=>\s*import\s*\(\s*['"](\.+[/a-zA-Z0-9_-]+)['"]\s*\)/g;

    let match;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
        const component = match[1];
        const matchStart = match.index;

        // 从 component 位置向前找到所在路由对象的起始 {
        let braceDepth = 0;
        let routeStart = -1;
        for (let i = matchStart - 1; i >= 0; i--) {
            if (content[i] === '}') braceDepth++;
            else if (content[i] === '{') {
                if (braceDepth === 0) {
                    routeStart = i;
                    break;
                }
                braceDepth--;
            }
        }

        let name = null;
        let routePath = null;
        if (routeStart >= 0) {
            const routeContext = content.slice(routeStart, matchStart);
            const nameMatch = routeContext.match(/\bname\s*:\s*(.+?)(?:,\s*(?:\r?\n|$)|\r?\n)/);
            if (nameMatch) name = nameMatch[1].trim();
            const pathMatch = routeContext.match(/\bpath\s*:\s*['"]([^'"]+)['"]/);
            if (pathMatch) routePath = pathMatch[1];
        }

        routes.push({ component, name, routePath });
    }

    return routes;
}

class DependencyGraphPlugin {
    constructor(callback) {
        this.callback = callback;
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('DependencyGraphPlugin', (compilation) => {
            compilation.hooks.finishModules.tap('DependencyGraphPlugin', (modules) => {
                const moduleGraph = compilation.moduleGraph;
                const depMap = new Map();
                for (const mod of modules) {
                    if (!mod.resource) continue;
                    const deps = [];
                    for (const conn of moduleGraph.getOutgoingConnections(mod)) {
                        if (conn.module?.resource) deps.push(conn.module.resource);
                    }
                    if (deps.length > 0) depMap.set(mod.resource, deps);
                }
                if (this.callback) this.callback(depMap);
            });
        });
    }
}

function buildDependencyGraph(projectRoot) {
    return new Promise((resolve, reject) => {
        const fullWebpackPath = path.join(projectRoot, 'build/webpack.base.conf.js');
        if (!fs.existsSync(fullWebpackPath)) {
            reject(new Error('找不到 webpack 配置文件'));
            return;
        }
        const baseWebpackConfig = require(fullWebpackPath);
        const moduleConfig = typeof baseWebpackConfig.module === 'function' ? baseWebpackConfig.module(false) : baseWebpackConfig.module;

        const minimalConfig = merge(
            {
                mode: 'none',
                context: baseWebpackConfig.context,
                entry: baseWebpackConfig.entry,
                resolve: baseWebpackConfig.resolve,
                module: moduleConfig
            },
            { mode: 'none', plugins: [] }
        );

        webpack(merge(minimalConfig, { mode: 'none', plugins: [new DependencyGraphPlugin(resolve)] }), (err, stats) => {
            if (err) {
                reject(err);
                return;
            }
            if (stats.hasErrors()) {
                reject(new Error(stats.toString({ errors: true })));
            }
        });
    });
}

module.exports.buildDependencyGraph = buildDependencyGraph;
module.exports.findRouterFile = findRouterFile;
module.exports.extractRoutePages = extractRoutePages;
module.exports.extractRouteMeta = extractRouteMeta;
