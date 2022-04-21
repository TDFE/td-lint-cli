"use strict";
const fs = require('fs');
const chalk = require("chalk");
const cwd = process.cwd();
//拷贝文件
function copyFile( dist, src ) {
  fs.writeFileSync(dist, fs.readFileSync(src, "utf-8"));
};
//拷贝文件夹
function copyDir(src, dist, callback) {
    fs.access(dist, function(err){
        if(err){
            // 目录不存在时创建目录
            fs.mkdirSync(dist);
        }
        _copy(null, src, dist);
    });

    function _copy(err, src, dist) {
        if(err){
            callback(err);
        } else {
            fs.readdir(src, (err, paths) => {
                if(err){
                    callback(err)
                } else {
                    paths.forEach((path) => {
                        if(path==="_"){
                            return;
                        }
                        const _src = src + '/' +path;
                        const _dist = dist + '/' +path;
                        fs.stat(_src, (err, stat) => {
                            if(err){
                                callback(err);
                            } else {
                                // 判断是文件还是目录
                                if(stat.isFile()) {
                                    fs.writeFileSync(_dist, fs.readFileSync(_src));
                                    console.log(fs.readFileSync(_src))
                                    console.log(chalk.green("→create "+ _dist + " success!"))
                                } else if(stat.isDirectory()) {
                                    // 当是目录是，递归复制
                                    copyDir(_src, _dist, callback)
                                }
                            }
                        })
                    })
                }
            })
        }
    };
};

module.exports = {
    copyDir,
    copyFile
}