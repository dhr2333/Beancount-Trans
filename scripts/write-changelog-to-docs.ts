#!/usr/bin/env node

/**
 * 将 semantic-release 生成的 CHANGELOG 写入到 Docs 子模块的版本更新日志中
 * 
 * 使用方法：
 * node --loader ts-node/esm scripts/write-changelog-to-docs.ts <version> <notes> [date]
 * 
 * 参数：
 * - version: 版本号，如 "1.0.0"
 * - notes: Release Notes (Markdown 格式)
 * - date: 发布日期（可选），如 "2025-11-15"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取命令行参数
const [version, notes, date] = process.argv.slice(2);

if (!version || !notes) {
  console.error('错误: 缺少必需参数');
  console.error('使用方法: node --loader ts-node/esm scripts/write-changelog-to-docs.ts <version> <notes> [date]');
  process.exit(1);
}

// 如果没有提供日期，尝试从 notes 中提取，或者使用当前日期
let releaseDate: string = date || '';
if (!releaseDate || releaseDate.trim() === '') {
  // 尝试从 notes 中提取日期（格式：## [version](url) (YYYY-MM-DD)）
  const dateMatch = notes.match(/\((\d{4}-\d{2}-\d{2})\)/);
  if (dateMatch) {
    releaseDate = dateMatch[1];
  } else {
    // 使用当前日期
    const now = new Date();
    releaseDate = now.toISOString().split('T')[0];
  }
}

// 目标文件路径
const changelogPath = path.join(__dirname, '..', 'Beancount-Trans-Docs', 'docs', '06-版本更新日志.md');

// 确保目录存在
const changelogDir = path.dirname(changelogPath);
if (!fs.existsSync(changelogDir)) {
  console.error(`错误: 目录不存在 ${changelogDir}`);
  console.error('');
  console.error('可能的原因:');
  console.error('1. Git Submodules 未初始化');
  console.error('2. Beancount-Trans-Docs 子模块未正确 checkout');
  console.error('');
  console.error('解决方法:');
  console.error('  在 CI/CD 的 Checkout 阶段添加: git submodule update --init --recursive');
  console.error('  或在本地执行: git submodule update --init --recursive');
  process.exit(1);
}

// 分类名称映射（英文 -> 中文）
const categoryMap: Record<string, string> = {
  'Features': '新功能',
  'Bug Fixes': 'Bug 修复',
  'Documentation': '文档更新',
  'Performance': '性能优化',
  'Refactor': '代码重构',
  'Style': '代码风格',
  'Test': '测试相关',
  'Chore': '构建/工具',
  'Reverts': '回滚',
  'BREAKING CHANGES': '破坏性变更'
};

/**
 * 转换分类标题为中文
 */
function translateCategory(category: string): string {
  return categoryMap[category] || category;
}

/**
 * 解析 Release Notes 并转换为中文格式
 */
function parseAndFormatNotes(notes: string): string {
  if (!notes || notes.trim() === '') {
    return '';
  }

  // 处理可能的转义字符（如 \n）
  // 先替换 \\n 为实际换行符（如果被转义了）
  let processedNotes = notes;
  // 如果包含字面量 \n，先替换为实际换行
  processedNotes = processedNotes.replace(/\\n/g, '\n');

  // 按行分割
  let lines = processedNotes.split('\n');
  
  // 移除开头的版本链接行（格式：## [version](url) (date)）
  // 这行是 semantic-release 自动添加的，我们不需要它
  if (lines.length > 0 && lines[0].match(/^##\s+\[.+\]\(.+\)\s+\(.+\)$/)) {
    lines = lines.slice(1);
    // 如果下一行是空行，也移除
    if (lines.length > 0 && lines[0].trim() === '') {
      lines = lines.slice(1);
    }
  }

  const result: string[] = [];
  let currentCategory: string | null = null;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过空行（但保留列表后的空行）
    if (line === '') {
      if (inList) {
        result.push('');
        inList = false;
      }
      continue;
    }

    // 检查是否是分类标题（### 开头）
    const categoryMatch = line.match(/^###\s+(.+)$/);
    if (categoryMatch) {
      // 如果之前有分类，先关闭列表
      if (currentCategory && inList) {
        result.push('');
        inList = false;
      }
      currentCategory = translateCategory(categoryMatch[1]);
      result.push(`### ${currentCategory}`);
      result.push('');
      continue;
    }

    // 检查是否是列表项（* 或 - 开头）
    const listMatch = line.match(/^[\*\-]\s+(.+)$/);
    if (listMatch) {
      result.push(`* ${listMatch[1]}`);
      inList = true;
      continue;
    }

    // 其他内容（如链接、代码块等）保持原样
    result.push(line);
    inList = false;
  }

  // 如果最后还在列表中，添加空行
  if (inList) {
    result.push('');
  }

  return result.join('\n');
}

/**
 * 读取现有的 CHANGELOG 文件
 */
function readExistingChangelog(): string {
  if (!fs.existsSync(changelogPath)) {
    // 文件不存在，返回默认头部
    return '# 版本更新日志\n';
  }

  try {
    const content = fs.readFileSync(changelogPath, 'utf-8');
    return content;
  } catch (error) {
    const err = error as Error;
    console.error(`错误: 无法读取文件 ${changelogPath}:`, err.message);
    process.exit(1);
  }
}

/**
 * 生成新版本的内容
 */
function generateVersionSection(version: string, notes: string, releaseDate: string): string {
  const formattedNotes = parseAndFormatNotes(notes);
  
  const section = `## v${version} (${releaseDate})

${formattedNotes}

---

`;

  return section;
}

/**
 * 提交并推送到 Docs 子仓库
 */
function commitAndPushToSubmodule(version: string, releaseDate: string): void {
  const docsDir = path.join(__dirname, '..', 'Beancount-Trans-Docs');
  const relativeChangelogPath = path.relative(docsDir, changelogPath);

  // 检查 Docs 目录是否存在
  if (!fs.existsSync(docsDir)) {
    console.error(`错误: Docs 子模块目录不存在 ${docsDir}`);
    process.exit(1);
  }

  // 检查是否是 Git 仓库
  const gitDir = path.join(docsDir, '.git');
  if (!fs.existsSync(gitDir)) {
    console.warn(`警告: ${docsDir} 不是 Git 仓库，跳过提交到子仓库`);
    return;
  }

  try {
    // 进入 Docs 目录
    process.chdir(docsDir);

    // 先尝试添加文件，然后检查是否有 staged 的更改
    // 这样可以更准确地检测文件是否真的改变了
    try {
      execSync(`git add "${relativeChangelogPath}"`, { stdio: 'ignore' });
      
      // 检查是否有 staged 的更改
      const diffCached = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).trim();
      if (!diffCached.includes(relativeChangelogPath)) {
        console.log('📝 文件未更改，跳过提交');
        // 重置暂存区
        execSync('git reset', { stdio: 'ignore' });
        return;
      }
      console.log(`✅ 检测到文件更改: ${relativeChangelogPath}`);
    } catch (error) {
      console.warn('警告: 无法检查文件更改状态，继续尝试提交');
    }

    // 配置 Git（如果还没有配置）
    try {
      // 检查是否已配置，如果没有则配置
      try {
        execSync('git config user.name', { stdio: 'ignore' });
      } catch {
        execSync('git config user.name "Beancount-Trans CI"', { stdio: 'ignore' });
      }
      try {
        execSync('git config user.email', { stdio: 'ignore' });
      } catch {
        execSync('git config user.email "ci@beancount-trans.local"', { stdio: 'ignore' });
      }
    } catch (error) {
      // 忽略配置错误，可能已经配置过了
    }

    // 文件已经在上面添加过了，这里只需要确认
    // 如果上面的检查已经添加了文件，这里就不需要再次添加
    try {
      const diffCached = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).trim();
      if (!diffCached.includes(relativeChangelogPath)) {
        // 如果文件不在暂存区，再次添加
        execSync(`git add "${relativeChangelogPath}"`, { stdio: 'inherit' });
      }
      console.log(`✅ 文件已在暂存区: ${relativeChangelogPath}`);
    } catch (error) {
      // 如果检查失败，直接添加
      execSync(`git add "${relativeChangelogPath}"`, { stdio: 'inherit' });
      console.log(`✅ 已添加文件到暂存区: ${relativeChangelogPath}`);
    }

    // 提交更改
    const commitMessage = `docs: update changelog for v${version} (${releaseDate})`;
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    console.log(`✅ 已提交到 Docs 子仓库`);

    // 获取远程 URL 并配置 token（如果需要）
    let remoteUrl: string;
    try {
      remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
    } catch (error) {
      console.error('错误: 无法获取远程仓库 URL');
      throw error;
    }

    // 从环境变量获取 GitHub Token
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      // 将远程 URL 转换为使用 token 的 URL
      // 处理格式: https://github.com/user/repo.git 或 git@github.com:user/repo.git
      if (remoteUrl.startsWith('https://github.com/')) {
        const urlMatch = remoteUrl.match(/https:\/\/(.*@)?github\.com\/(.+?)(\.git)?$/);
        if (urlMatch) {
          const repoPath = urlMatch[2];
          remoteUrl = `https://x-access-token:${githubToken}@github.com/${repoPath}`;
          execSync(`git remote set-url origin "${remoteUrl}"`, { stdio: 'ignore' });
          console.log('✅ 已配置子模块远程 URL（使用 token）');
        }
      } else if (remoteUrl.startsWith('git@github.com:')) {
        // SSH 格式，转换为 HTTPS + token
        const urlMatch = remoteUrl.match(/git@github\.com:(.+?)(\.git)?$/);
        if (urlMatch) {
          const repoPath = urlMatch[1];
          remoteUrl = `https://x-access-token:${githubToken}@github.com/${repoPath}`;
          execSync(`git remote set-url origin "${remoteUrl}"`, { stdio: 'ignore' });
          console.log('✅ 已配置子模块远程 URL（从 SSH 转换为 HTTPS + token）');
        }
      }
    } else {
      console.warn('警告: GITHUB_TOKEN 环境变量未设置，可能无法推送到子仓库');
    }

    // 推送到远程仓库
    try {
      execSync('git push origin main', { stdio: 'inherit' });
      console.log(`✅ 已推送到 Docs 子仓库`);
    } catch (error) {
      console.error('错误: 推送到 Docs 子仓库失败');
      console.error('提示: 请确保 GITHUB_TOKEN 环境变量已设置，并且有推送权限');
      throw error;
    }

    // 回到原目录
    process.chdir(__dirname);
  } catch (error) {
    const err = error as Error;
    console.error(`错误: 提交到 Docs 子仓库失败:`, err.message);
    // 不退出，因为主仓库的提交仍然需要完成
    console.warn('警告: 将继续主仓库的提交流程');
  }
}

/**
 * 主函数
 */
function main(): void {
  console.log(`正在更新版本日志: v${version} (${releaseDate})`);

  // 读取现有内容
  const existingContent = readExistingChangelog();

  // 生成新版本内容
  const newSection = generateVersionSection(version, notes, releaseDate);

  // 如果文件只有标题，直接追加
  // 否则在标题后插入新版本
  let newContent: string;
  if (existingContent.trim() === '# 版本更新日志' || existingContent.trim() === '# 版本更新日志\n') {
    newContent = existingContent.trim() + '\n\n' + newSection;
  } else {
    // 在标题后插入新版本
    const titleMatch = existingContent.match(/^(# 版本更新日志\s*\n)/);
    if (titleMatch) {
      newContent = titleMatch[1] + '\n' + newSection + existingContent.substring(titleMatch[0].length);
    } else {
      // 如果没有找到标题，在开头添加
      newContent = '# 版本更新日志\n\n' + newSection + existingContent;
    }
  }

  // 写入文件
  try {
    fs.writeFileSync(changelogPath, newContent, 'utf-8');
    console.log(`✅ 成功更新 ${changelogPath}`);
  } catch (error) {
    const err = error as Error;
    console.error(`错误: 无法写入文件 ${changelogPath}:`, err.message);
    process.exit(1);
  }

  // 提交并推送到 Docs 子仓库
  console.log('\n📦 开始提交到 Docs 子仓库...');
  commitAndPushToSubmodule(version, releaseDate);
}

// 执行主函数
main();

