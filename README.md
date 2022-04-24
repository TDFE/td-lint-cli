### 安装包

``` javascript
// 安装前请将源切换至 http://npm.tongdun.me/
npm install @td/tdc -g
```

### 查看是否安装成功

``` javascript
tdc --version
```

### 查看所有命令

``` javascript
tdc -h
```

### tdc eslint

- package.json 中新增exlint-fixed命令
- 删除package.json中老的关于eslint的包
- 增加新版eslint的依赖包(每次都会更新到最新的版本)
- 增加pre-commit的钩子
- 修改build.sh文件，增加打包校验eslint
- 重新install
  
### tdc husky

- package.json 中新增prepare/changeLog命令
- 删除package.json中老的关于husky的包
- 增加新版husky的依赖包(每次都会更新到最新的版本)
- 增加commit-msg的钩子
- 重新install
  
### tdc all

- 执行eslint & husky命令的功能
