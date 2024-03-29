### 安装包

``` javascript
npm install tdmc -g
```

### 查看是否安装成功

``` javascript
tdmc --version
```

### 查看所有命令

``` javascript
tdmc -h
```

### tdmc eslintHusky

- 执行eslint & husky命令的功能

### tdmc eslint

- package.json中新增exlint-fixed命令
- 删除package.json中老的关于eslint的包
- 增加新版eslint的依赖包(每次都会更新到最新的版本)
- 增加pre-commit的钩子
- 重新install
  
### tdmc husky

- package.json中新增prepare/changeLog命令
- 删除package.json中老的关于husky的包
- 增加新版husky的依赖包(每次都会更新到最新的版本)
- 增加commit-msg的钩子
- 重新install
  
### tdmc cicd

- 增加cicd的配置（区分node/nginx）

### tdmc vite

- 在根目录下创建vite.config.js文件（如果不需要特殊配置可以不创建）,配置如下，其他配置参考vite官方文档
``` javascript
module.exports = {
    plugins: [],
    resolve: []
};
```
- proxy默认会取build/config.js的proxyTable和port

### tdmc slim

- 删除工程内未被引用的文件

### 注意事项
如果权限非管理员的话，请将电脑设置为管理员权限
