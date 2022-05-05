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

module.exports = {
    question,
    getCiCdQuest
};