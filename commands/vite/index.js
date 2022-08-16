#!/usr/bin/env node
const path = require('path');
const vite = require('vite');

module.exports = async function () {
    const server = await vite.createServer({
        configFile: path.resolve(__dirname, './vite.config.js'),
        root: process.cwd()
    });
    await server.listen();

    server.printUrls();
};
