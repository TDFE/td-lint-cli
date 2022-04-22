module.exports = {
    extends: ['@commitlint/config-conventional'],
    // 以下时我们自定义的规则
    rules: {
        'type-enum': [
          2,
          'always',
          [
            'feat', // 新功能（feature）
            'fix', // 修补bug
            'ci', // 部署
            'revert' // feat(pencil): add ‘graphiteWidth’ option (撤销之前的commit)
          ]
        ],
        'type-case': [0],
        'type-empty': [0],
        'scope-empty': [0, 'never'],
        'scope-case': [0, 'never'],
        'subject-full-stop': [0, 'never'],
        'subject-case': [0, 'never'],
        'header-max-length': [0, 'always', 100]
      }
};
