const { createGunzip } = require('zlib');
const tar = require('tar-stream');
const axios = require('axios');

module.exports = async (pkgName) => {
    const { data: tarballUrl } = await axios.get(`https://registry.npmjs.org/${pkgName}/latest`, {
        responseType: 'json'
    });
    const url = tarballUrl.dist.tarball;

    const response = await axios({
        url,
        responseType: 'stream'
    });

    const extract = tar.extract();
    const svgFiles = {};

    extract.on('entry', (header, stream, next) => {
        if (header.type === 'file' && header.name.endsWith('.svg')) {
            let content = '';
            stream.on('data', (chunk) => (content += chunk.toString()));
            stream.on('end', () => {
                svgFiles[header.name] = content;
                next();
            });
        } else {
            stream.resume(); // 必须消费流
            next();
        }
    });

    response.data.pipe(createGunzip()).pipe(extract);

    return new Promise((resolve, reject) => {
        extract.on('finish', () => resolve(svgFiles));
        extract.on('error', reject);
    });
};
