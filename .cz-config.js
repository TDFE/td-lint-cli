module.exports = {
    // type 类型
    types: [
        { value: 'feat', name: '✨ feat:新增产品功能' },
        { value: 'fix', name: '🐛 fix:修复 bug' },
        { value: 'style', name: '💄 style:更新UI和样式文件(不影响代码运行的变动)' },
        { value: 'merge', name: '🔀 merge:分支合并' },
        { value: 'linter', name: '🚨 linter:移除linter警告' },
        { value: 'build', name: '🔧 build:构建流程、外部依赖变更，比如升级 npm 包、修改 webpack 配置等' },
        { value: 'ci', name: '🤖️ ci:修改了CI配置、脚本' },
        { value: 'tag', name: '🔖 tag:发行/版本标签' },
        { value: 'chore', name: '👷 chore:对构建过程或辅助工具和库（如文档生成）的更改' },
        { value: 'refactor', name: '🔨 refactor:重构（既不是修 bug ，也不是加功能）' },
        { value: 'docs', name: '📕 docs:仅修改文档' },
        { value: 'perf', name: '⚡️ perf:性能优化' },
        { value: 'test', name: '☑️  test:测试相关' }
    ],
    // scope 类型，针对 React 项目
    // scopes: [],
    // 覆写提示的信息
    messages: {
        type: "请确保你的提交遵循了原子提交规范！\n选择你要提交的类型:",
        scope: '\n选择一个 scope (可选):',
        customScope: '请输入自定义的 scope:',
        subject: '填写一个简短精炼的描述语句:\n',
        body: '添加一个更加详细的描述，可以附上新增功能的描述或 bug 链接、截图链接 (可选)。使用 "|" 换行:\n',
        breaking: '列举非兼容性重大的变更 (可选):\n',
        footer: '列举出所有变更的 ISSUES CLOSED  (可选)。 例如.: #31, #34:\n',
        confirmCommit: '确认提交?',
    },

    // 是否允许自定义填写 scope ，设置为 true ，会自动添加两个 scope 类型 [{ name: 'empty', value: false },{ name: 'custom', value: 'custom' }]
    // allowCustomScopes: true,
    // allowBreakingChanges: [], //['feat', 'fix'],
    // skip any questions you want
    skipQuestions: ['scope', 'body', 'footer'], //'confirmCommit'

    // subject 限制长度
    subjectLimit: 100,
    // breaklineChar: '|', // 支持 body 和 footer
    // footerPrefix : 'ISSUES CLOSED:'
    // askForBreakingChangeFirst : true,
  };
