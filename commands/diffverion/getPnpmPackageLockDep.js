const YAML = require('yaml');

function parsePackage(str) {
    const match = str.match(/^(@[^@\/]+\/[^@]+|[^@]+)@(.+)$/);
    if (match) {
        return match[1];
    }
    return '';
}

function parseVersionAndDetail(str) {
    // 第一步：检查是否以 x.y.z 开头
    const versionMatch = str.match(/^(\d+\.\d+\.\d+)/);
    if (!versionMatch) {
        return null;
    }

    const pkgVersion = versionMatch[1];
    const rest = str.slice(versionMatch[0].length); // 剩余部分："(xxx)(yyy)..."

    // 第二步：匹配所有 (...) 内容
    const dependencies = [];
    let match;
    const regex = /\(([^)]*)\)/g;

    while ((match = regex.exec(rest)) !== null) {
        const content = match[1].trim();
        if (content) {
            dependencies.push(content);
        }
    }
    return {
        pkgVersion,
        pkgNameList: Array.isArray(dependencies) ? dependencies.map((i) => parsePackage(i)) : []
    };
}

function splitAtFirstAt(str) {
    const index = str.indexOf('@');
    if (index === -1) {
        return { before: str, after: '' };
    }
    return {
        before: str.slice(0, index),
        after: str.slice(index + 1)
    };
}

const buildLockTree = (name, version, packages, originKeys = [], parentPath = []) => {
    let item;
    // 兼容
    // /string-width@4.2.3
    // /tntd@2.8.54(@babel/core@7.28.5)(antd@3.26.20)(react-dom@16.13.1)(react-is@19.2.0)(react@16.14.0)
    // 这种version是一个引入的场景
    if (!!packages[version]) {
        item = packages[version];
        const { after } = splitAtFirstAt(version);
        version = after;
    } else {
        item = packages[`/${name}@${version}`];
    }

    const { dependencies } = item;

    // 兼容0.3.25(dagre@0.8.5)
    if (version.includes('(') && version.includes(')')) {
        const { pkgVersion } = parseVersionAndDetail(version) || {};
        if (pkgVersion) {
            version = pkgVersion;
        }
    }

    if (!dependencies || !Object.keys(dependencies).length) {
        return { version };
    }

    let transformDependencies = {};
    for (let i in dependencies) {
        const _version = dependencies[i];
        if (parentPath.includes(i)) {
            transformDependencies[i] = {};
        } else {
            transformDependencies[i] = buildLockTree(i, _version, packages, originKeys, [...parentPath, i]);
        }
    }

    return {
        version,
        dependencies: transformDependencies
    };
};

module.exports = async (fileContent) => {
    const { dependencies, packages } = YAML.parse(fileContent);
    let obj = {};
    const originKeys = Object.keys(dependencies);
    for (let i in dependencies) {
        const { version } = dependencies[i];
        obj[i] = buildLockTree(i, version, packages, originKeys, []);
    }
    return obj;
};
