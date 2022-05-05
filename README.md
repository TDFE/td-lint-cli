### 安装包(安装前请将源切换至 <http://npm.tongdun.me/>)

``` javascript
npm install @td/tdmc -g
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
- 修改build.sh文件，增加打包校验eslint
- 重新install
  
### tdmc husky

- package.json中新增prepare/changeLog命令
- 删除package.json中老的关于husky的包
- 增加新版husky的依赖包(每次都会更新到最新的版本)
- 增加commit-msg的钩子
- 重新install
  
### tdmc cicd

- 增加cicd的配置（区分node/nginx）

### 注意事项
如果权限非管理员的话，所有命令之前都需要增加 sudo,例如sudo tdmc cicd