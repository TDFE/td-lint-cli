const fs = require('fs');
const path = require('path');

const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

function getAllSourceFiles(dir, files = []) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build', '.next', 'modules'].includes(entry.name)) {
                getAllSourceFiles(fullPath, files);
            }
        } else if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }
    return files;
}

/**
 * 一次性扫描目录，返回 Map<filePath, content>，避免重复 readFileSync
 */
function buildFileContentMap(baseDir) {
    const contentMap = new Map();
    for (const filePath of getAllSourceFiles(baseDir)) {
        contentMap.set(filePath, fs.readFileSync(filePath, 'utf-8'));
    }
    return contentMap;
}

/**
 * 检查文件是否从 @tntd/utils 导入了指定的 validatorName
 */
function findFilesImportingValidator(contentMap, validatorName) {
    const result = [];
    const tntdImportRe = /import\s+.*from\s+['"]@tntd\/utils(?:\/[^'"]*)?['"]/;

    for (const [filePath, content] of contentMap) {
        if (!tntdImportRe.test(content)) continue;

        // 命名导入
        const namedRe = /import\s+\{([^}]+)\}\s+from\s+['"]@tntd\/utils['"]/g;
        let match;
        while ((match = namedRe.exec(content)) !== null) {
            if (
                match[1]
                    .split(',')
                    .map((n) => n.trim())
                    .includes(validatorName)
            ) {
                result.push(filePath);
                break;
            }
        }
        if (result[result.length - 1] === filePath) continue;

        // 默认导入
        const defaultRe = /import\s+(\w+)\s+from\s+['"]@tntd\/utils['"]/g;
        while ((match = defaultRe.exec(content)) !== null) {
            if (match[1] === validatorName) {
                result.push(filePath);
                break;
            }
        }
    }
    return result;
}

/**
 * 分析文件导出，判断是否 re-export 了 validatorName
 */
function analyzeExports(content, validatorName) {
    const result = { isExportValidator: false, validatorExportedNames: [] };

    if (new RegExp(`export\\s+\\{${validatorName}\\}`).test(content)) {
        result.isExportValidator = true;
        result.validatorExportedNames.push(validatorName);
    }

    const assignRe = /export\s+(?:const\s+)?(\w+)\s*=\s*(\w+)\s*\(/g;
    let match;
    while ((match = assignRe.exec(content)) !== null) {
        if (match[2] === validatorName) {
            result.isExportValidator = true;
            result.validatorExportedNames.push(match[1]);
        }
    }
    return result;
}

/**
 * 检查变量名是否在代码中实际使用（排除注释和 import 语句）
 */
function isVariableUsed(content, varName) {
    const stripped = content
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/import\s+.*$/gm, '');

    return (
        new RegExp(`\\b${varName}\\s*\\(`).test(stripped) ||
        new RegExp(`[=,(<:\\s]\\s*${varName}\\b`).test(stripped) ||
        new RegExp(`\\{[^}]*\\b${varName}\\b[^}]*\\}`).test(stripped)
    );
}

/**
 * 查找引用了 sourceFile 中指定 exportedName 且实际使用它的文件
 */
function findFilesReferencingExport(contentMap, sourceFile, exportedName) {
    const sourceFileName = path.basename(sourceFile, path.extname(sourceFile));
    const result = [];

    for (const [filePath, content] of contentMap) {
        if (filePath === sourceFile) continue;

        const importRe = new RegExp(`import\\s+.*from\\s+['"](\\.\\.?/|@/.*)${sourceFileName}['"]`);
        if (!importRe.test(content)) continue;

        const namedRe = new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+['"](\\.\\.?/|@/.*)${sourceFileName}['"]`, 'g');
        let match;
        while ((match = namedRe.exec(content)) !== null) {
            for (const name of match[1].split(',').map((n) => n.trim())) {
                const [original, alias] = name.split(/\s+as\s+/).map((s) => s.trim());
                if (original === exportedName || alias === exportedName) {
                    if (isVariableUsed(content, alias || original)) {
                        result.push(filePath);
                        break;
                    }
                }
            }
        }
    }
    return result;
}

/**
 * 主函数
 */
module.exports = async function (options) {
    const projectRoot = process.cwd();
    const baseDir = options?.dir || path.join(projectRoot, 'src');

    if (!fs.existsSync(baseDir)) {
        console.error(`❌ 目录不存在: ${baseDir}`);
        process.exit(1);
    }

    const validatorName = options?.validator || 'validatorName';
    const returnArray = options?.json || false;

    // 一次性读取所有源文件内容
    const contentMap = buildFileContentMap(baseDir);

    const filesWithImport = findFilesImportingValidator(contentMap, validatorName);
    if (filesWithImport.length === 0) {
        return returnArray ? [] : undefined;
    }

    const report = [];

    for (const filePath of filesWithImport) {
        const relativePath = path.relative(projectRoot, filePath);
        const content = contentMap.get(filePath);
        const exportInfo = analyzeExports(content, validatorName);

        if (exportInfo.isExportValidator) {
            // 文件 re-export 了 validator，找真正使用 exportedName 的消费者
            for (const exportedName of exportInfo.validatorExportedNames) {
                for (const refFile of findFilesReferencingExport(contentMap, filePath, exportedName)) {
                    report.push({
                        sourceFile: path.relative(projectRoot, refFile),
                        referenceType: 'via-export',
                        via: relativePath,
                        exportedName
                    });
                }
            }
        } else if (isVariableUsed(content, validatorName)) {
            // 直接使用 validator 的文件
            report.push({ sourceFile: relativePath, referenceType: 'direct' });
        }
    }

    if (returnArray) return report;

    console.log('='.repeat(80));
    console.log('📊 分析报告汇总');
    console.log('='.repeat(80));
    if (report.length === 0) {
        console.log('✅ 未发现引用链');
    } else {
        console.log(`共发现 ${report.length} 个文件:\n`);
        for (const item of report) {
            const via = item.via ? ` (via ${item.via} → ${item.exportedName})` : '';
            console.log(`${item.sourceFile}${via}`);
        }
    }
};
