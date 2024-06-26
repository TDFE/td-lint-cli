// 命令行提问内容
const question = [
    {
        type: 'list',
        name: 'type',
        message: '请选择类型:',
        choices: ['react', 'vue', 'js']
    },
    {
        type: 'confirm',
        name: 'isTs',
        message: '是否为ts项目',
        default: false,
        validate(val) {
            return val;
        }
    }
];

// cicd 提问内容
const getCiCdQuest = (defaultName) => [
    {
        type: 'list',
        name: 'type',
        message: '请选择类型:',
        choices: ['nginx', 'node']
    },
    {
        type: 'input',
        name: 'name',
        message: '请输入名称，默认为项目名',
        default: defaultName
    }
];

// silm 提问内容
const slimQuest = [
    {
        type: 'input',
        name: 'dirName',
        message: '请输入需要检测的目录,比如src/component,默认为src',
        default: 'src'
    },
    {
        type: 'input',
        name: 'webpackPath',
        message: '请输入webpack配置所在位置,默认为build/webpack.base.conf',
        default: 'build/webpack.base.conf'
    },
    {
        type: 'confirm',
        name: 'isDel',
        message: '是否自动删除',
        default: false,
        validate(val) {
            return val;
        }
    }
];

// cssvar 提问内容
const cssVarQuest = [
    {
        type: 'input',
        name: 'goalPath',
        message: '请输入需要提取css变量的路径',
        default: './src'
    }
];

const slimPackageQuest = [
    {
        type: 'input',
        name: 'webpackPath',
        message: '请输入webpack配置所在位置,默认为build/webpack.base.conf',
        default: 'build/webpack.base.conf'
    },
    {
        type: 'confirm',
        name: 'isDel',
        message: '是否自动删除',
        default: false,
        validate(val) {
            return val;
        }
    }
];

// 包的版本
const mapVersion = {
    '@commitlint/cli': '17.0.0',
    '@commitlint/config-conventional': '17.0.0',
    commitizen: '4.2.4',
    'cz-customizable': '6.3.0',
    'cz-conventional-changelog': '3.3.0',
    husky: '8.0.1',
    eslint: '8.15.0',
    'eslint-config-tongdun': '1.1.11',
    'eslint-plugin-td-rules-plugin': '1.0.1',
    'lint-staged': '12.4.1',
    'conventional-changelog-cli': '2.2.2',
    typescript: '4.6.4',
    '@types/node': '17.0.33',
    '@types/react': '18.0.9',
    '@types/react-dom': '18.0.4',
    '@types/jest': '27.5.1'
};

module.exports = {
    question,
    slimQuest,
    slimPackageQuest,
    getCiCdQuest,
    mapVersion,
    cssVarQuest
};
