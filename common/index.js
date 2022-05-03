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

module.exports = {
    question
};