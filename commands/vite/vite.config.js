const path = require('path');
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const { viteCommonjs, esbuildCommonjs } = require('@originjs/vite-plugin-commonjs');
const vitePluginImp = require('vite-plugin-imp');
const legacy = require('@vitejs/plugin-legacy');
const { tdViteTransformReact } = require('vite-plugin-tongdun-transform');
const inject = require('@rollup/plugin-inject');
const { merge } = require('lodash');

const urlPath = process.cwd();

// 读取webpack config的配置
const buildConfig = require(path.resolve(urlPath, './build/config.js'));
const { proxyTable, port } = (buildConfig && buildConfig.dev) || {};
const { htmlTemplatePath } = (buildConfig && buildConfig.common) || {};
// 转换为相对路径
const relativeHtmlTemplatePath = htmlTemplatePath ? htmlTemplatePath.replace(process.cwd(), '.') : '';

// 读取webpack.base.config.js的配置
const webpackBaseConfig = require(path.resolve(urlPath, './build/webpack.base.conf.js'));
const entriesPath = (webpackBaseConfig && webpackBaseConfig.entry && webpackBaseConfig.entry.app) || '';

// 自定义配置
let customSet = {};
try {
    customSet = require(path.resolve(urlPath, './vite.config.js'));
} catch (e) {
    console.log('当前项目无特殊配置,如需配属配置请在根目录新建vite.config.js文件,配置请参考https://cn.vitejs.dev/guide/');
}

let proxy = {};

for (const i in proxyTable) {
    const { pathRewrite, ...rest } = proxyTable[i];
    const keys = pathRewrite ? Object.keys(pathRewrite) : [];
    if (keys.length) {
        proxy[i] = {
            rewrite: (path) => path.replace(keys[0], pathRewrite[keys[0]])
        };
    }
    proxy[i] = {
        ...proxy[i],
        ...rest
    };
}

/** tntd组件名 */
const toUpper = function (str) {
    if (!!str) {
        const humpStr = str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
        const [first, ...rest] = humpStr;
        return first.toUpperCase() + rest.join('');
    }

    return '';
};

// https://vitejs.dev/config/
const defaultSet = {
    plugins: [
        legacy({
            targets: ['defaults', 'not IE 11']
        }),
        viteCommonjs(),
        inject({
            React: 'react'
        }),
        tdViteTransformReact({
            htmlPath: relativeHtmlTemplatePath || './src/index.html', // html的地址
            entriesPath: entriesPath ? (entriesPath[0] === '.' ? entriesPath.substring(1, entriesPath.length) : entriesPath) : '/src/app.js' // 入口js文件
        }),
        react({
            jsxRuntime: 'classic',
            babel: {
                cwd: __dirname,
                plugins: [
                    '@babel/plugin-transform-react-jsx',
                    // 不写会报require错误
                    [
                        'import',
                        {
                            libraryName: 'antd',
                            libraryDirectory: 'es',
                            style: true
                        },
                        'antd'
                    ],
                    [
                        'import',
                        {
                            libraryName: 'tntd',
                            libraryDirectory: 'es',
                            camel2DashComponentName: false
                        },
                        'tntd'
                    ]
                ]
            }
        }),
        vitePluginImp({
            optimize: true,
            libList: [
                {
                    libName: 'antd',
                    libDirectory: 'es',
                    style: (name) => `antd/es/${name}/style`
                },
                {
                    libName: 'tntd',
                    libDirectory: 'es',
                    style: (name) => {
                        if (!['development-login', 'img', 'layout', 'loading-button', 'select', 'table'].includes(name)) {
                            return `tntd/es/${toUpper(name)}/index.less`;
                        }
                        return '';
                    }
                }
            ]
        })
    ],
    resolve: {
        alias: [
            { find: '@', replacement: path.resolve(urlPath, 'src') },
            { find: /^~@tntd/, replacement: path.resolve(urlPath, 'node_modules/@tntd/') },
            {
                find: 'react-draggable',
                replacement: path.resolve(urlPath, 'node_modules/react-draggable/build/web/react-draggable.min.js')
            },
            // 不添加会报props.oneOf错误
            { find: 'react-resizable', replacement: path.resolve(urlPath, 'node_modules/react-resizable/dist/bundle.js') },
            // 因为history包console里面有 history%s 会被esbuild误认为包
            { find: 'history/createHashHistory', replacement: path.resolve(urlPath, 'node_modules/history/es/createHashHistory.js') }
        ]
    },
    define: {
        'process.env': {
            SYS_ENV: 'development',
            NODE_ENV: 'development'
        }
    },
    optimizeDeps: {
        entries: [],
        esbuildOptions: {
            plugins: [
                // Solves:
                // https://github.com/vitejs/vite/issues/5308
                // add the name of your package
                esbuildCommonjs(['history'])
            ]
        }
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
                modifyVars: {
                    hack: 'true; @import "~@tntd/antd-cover/tnt.less";'
                }
            }
        },
        postcss: {
            plugins: [
                require('postcss-modules')({
                    scopeBehaviour: 'global',
                    getJSON: () => { }
                })
            ]
        }
    },
    server: {
        open: true,
        host: '0.0.0.0',
        port,
        cors: true,
        proxy
    }
};

module.exports = defineConfig(merge(defaultSet, customSet));
