#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const workspaceRoot = resolve(new URL('.', import.meta.url).pathname, '..');

const version = process.argv[2];

if (!version) {
  console.error('缺少版本号参数，示例：node scripts/update-version.js 1.2.3');
  process.exit(1);
}

const formatJson = (data) => `${JSON.stringify(data, null, 2)}\n`;

const updatePackageVersion = (relativePath) => {
  const filePath = resolve(workspaceRoot, relativePath);
  if (!existsSync(filePath)) {
    console.warn(`未找到 ${relativePath}，跳过版本同步`);
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  const pkg = JSON.parse(content);

  if (pkg.version === version) {
    console.log(`${relativePath} 已是版本 ${version}，无需修改`);
    return;
  }

  pkg.version = version;
  writeFileSync(filePath, formatJson(pkg), 'utf8');
  console.log(`已更新 ${relativePath} -> ${version}`);
};

const ensureReleaseNotes = (version) => {
  const docsDir = resolve(workspaceRoot, 'Beancount-Trans-Docs', 'docs', '07-版本更新日志');
  if (!existsSync(docsDir)) {
    console.warn(`未找到版本更新日志目录 ${docsDir}，跳过文档预填充`);
    return;
  }

  const fileName = `v${version}.md`;
  const targetPath = resolve(docsDir, fileName);

  if (existsSync(targetPath)) {
    console.log(`日志文件 ${fileName} 已存在，跳过创建`);
    return;
  }

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const template = [
    `# v${version}`,
    '',
    `> 发布日期：${dateStr}`,
    '',
    '## ✨ 新功能',
    '- （待补充）',
    '',
    '## 🐞 修复',
    '- （待补充）',
    '',
    '## 🛠 其他变更',
    '- （待补充）',
    ''
  ].join('\n');

  writeFileSync(targetPath, template, 'utf8');
  console.log(`已创建版本日志模板 ${fileName}`);
};

updatePackageVersion('Beancount-Trans-Frontend/package.json');
updatePackageVersion('Beancount-Trans-Docs/package.json');
ensureReleaseNotes(version);

