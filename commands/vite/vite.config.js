const fs = require('fs');
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
let relativeHtmlTemplatePath = htmlTemplatePath ? htmlTemplatePath.replace(process.cwd(), '.') : '';

// 如果是ejs结尾的入口
if (htmlTemplatePath && htmlTemplatePath.includes('.ejs')) {
    const str = fs.readFileSync(relativeHtmlTemplatePath, 'utf-8');
    fs.writeFileSync(path.resolve(process.cwd(), './node_modules/.vite/index.html'), str, 'utf-8');
    relativeHtmlTemplatePath = './node_modules/.vite/index.html';
}

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
            { find: /^~tntd/, replacement: path.resolve(urlPath, 'node_modules/tntd/') },
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
        include: [
            'antd/es/affix',
            'antd/es/affix/style',
            'antd/es/anchor',
            'antd/es/anchor/style',
            'antd/es/alert',
            'antd/es/alert/style',
            'antd/es/avatar',
            'antd/es/avatar/style',
            'antd/es/badge',
            'antd/es/badge/style',
            'antd/es/breadcrumb',
            'antd/es/breadcrumb/style',
            'antd/es/button',
            'antd/es/button/style',
            'antd/es/calendar',
            'antd/es/calendar/style',
            'antd/es/card',
            'antd/es/card/style',
            'antd/es/collapse',
            'antd/es/collapse/style',
            'antd/es/carousel',
            'antd/es/carousel/style',
            'antd/es/cascader',
            'antd/es/cascader/style',
            'antd/es/checkbox',
            'antd/es/checkbox/style',
            'antd/es/col',
            'antd/es/col/style',
            'antd/es/comment',
            'antd/es/comment/style',
            'antd/es/descriptions',
            'antd/es/descriptions/style',
            'antd/es/divider',
            'antd/es/divider/style',
            'antd/es/dropdown',
            'antd/es/dropdown/style',
            'antd/es/drawer',
            'antd/es/drawer/style',
            'antd/es/empty',
            'antd/es/empty/style',
            'antd/es/form',
            'antd/es/form/style',
            'antd/es/icon',
            'antd/es/icon/style',
            'antd/es/input',
            'antd/es/input/style',
            'antd/es/layout',
            'antd/es/layout/style',
            'antd/es/list',
            'antd/es/list/style',
            'antd/es/message',
            'antd/es/message/style',
            'antd/es/menu',
            'antd/es/menu/style',
            'antd/es/mentions',
            'antd/es/mentions/style',
            'antd/es/modal',
            'antd/es/modal/style',
            'antd/es/statistic',
            'antd/es/statistic/style',
            'antd/es/notification',
            'antd/es/notification/style',
            'antd/es/pagination',
            'antd/es/pagination/style',
            'antd/es/popconfirm',
            'antd/es/popconfirm/style',
            'antd/es/popover',
            'antd/es/popover/style',
            'antd/es/progress',
            'antd/es/progress/style',
            'antd/es/radio',
            'antd/es/radio/style',
            'antd/es/rate',
            'antd/es/rate/style',
            'antd/es/result',
            'antd/es/result/style',
            'antd/es/row',
            'antd/es/row/style',
            'antd/es/select',
            'antd/es/select/style',
            'antd/es/skeleton',
            'antd/es/skeleton/style',
            'antd/es/slider',
            'antd/es/slider/style',
            'antd/es/spin',
            'antd/es/spin/style',
            'antd/es/steps',
            'antd/es/steps/style',
            'antd/es/switch',
            'antd/es/switch/style',
            'antd/es/table',
            'antd/es/table/style',
            'antd/es/transfer',
            'antd/es/transfer/style',
            'antd/es/tree',
            'antd/es/tree/style',
            'antd/es/tabs',
            'antd/es/tabs/style',
            'antd/es/tag',
            'antd/es/tag/style',
            'antd/es/timeline',
            'antd/es/timeline/style',
            'antd/es/tooltip',
            'antd/es/tooltip/style',
            'antd/es/typography',
            'antd/es/typography/style',
            'antd/es/mention',
            'antd/es/mention/style',
            'antd/es/upload',
            'antd/es/upload/style',
            'antd/es/date-picker',
            'antd/es/date-picker/style',
            'antd/es/auto-complete',
            'antd/es/auto-complete/style',
            'antd/es/back-top',
            'antd/es/back-top/style',
            'antd/es/config-provider',
            'antd/es/config-provider/style',
            'antd/es/input-number',
            'antd/es/input-number/style',
            'antd/es/locale-provider',
            'antd/es/locale-provider/style',
            'antd/es/tree-select',
            'antd/es/tree-select/style',
            'antd/es/time-picker',
            'antd/es/time-picker/style',
            'echarts',
            'react-sortablejs',
            'uuid',
            '@tntd/utils',
            'tntd/es/QueryListScene',
            'tntd/es/Handle',
            'tntd/es/Ellipsis',
            'dva/fetch',
            'lodash-es',
            'mmeditor',
            'tntd/es/Icon',
            'tntd/es/Modal',
            '@tntd/tooltip-select',
            'tntd/es/Select'
        ],
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
                    getJSON: () => {}
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
