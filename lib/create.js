"use strict";
const path = require('path');
const chalk = require("chalk");
const child_process = require('child_process');
const cwd = process.cwd();
const copy = require('./copy.js');
const [copyDir,copyFile] = [copy.copyDir,copy.copyFile];

const copySrc = (config='') => {
    const src = path.resolve(__dirname, "../template/.husky");
    const dist = path.resolve(cwd, "./" + config + "/.husky");
    copyDir(src, dist, (err) => {
        if(err){
            console.log(err);
        }
    });
};

const copyFileJs = (config='') => {
  copyFile(path.resolve(cwd, "./" + config + "/.cz-config.js"),path.resolve(__dirname, "../template/.cz-config.js"));
  console.log(chalk.green("→create" + cwd + "/.cz-config.js success!"));
  
  copyFile(path.resolve(cwd, "./" + config + "/commitlint.config.js"),path.resolve(__dirname, "../template/commitlint.config.js"));
  console.log(chalk.green("→create" + cwd + "/commitlint.config.js success!"));
};

function copyIt(from, to) {
    child_process.spawn('cp', ['-ri', from, to]); 
}

module.exports = (config) => {
    // copySrc(config)
    copyIt(path.resolve(__dirname, "../template/.husky/commit-msg"),path.resolve(cwd, "./.husky/commit-msg"));
    copyIt(path.resolve(__dirname, "../template/.husky/prepare-commit-msg"),path.resolve(cwd, "./.husky/prepare-commit-msg"));
    copyFileJs(config)
}