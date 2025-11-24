import type { Options } from 'semantic-release';

const config: Options = {
  branches: ['main'],
  repositoryUrl: 'https://github.com/dhr2333/Beancount-Trans',
  tagFormat: '${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits'
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits'
      }
    ],
    [
      '@semantic-release/exec',
      {
        // 在 prepare 阶段执行脚本，此时 nextRelease 已确定
        // nextRelease 没有 date 字段，脚本会从 notes 中提取日期或使用当前日期
        // 脚本会自动提交并推送到 Docs 子仓库
        prepareCmd: 'TS_NODE_PROJECT=tsconfig.release.json NODE_OPTIONS="--loader ts-node/esm" node scripts/write-changelog-to-docs.ts "${nextRelease.version}" "${nextRelease.notes}"'
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: [
          'package.json',
          'package-lock.json',
          'Beancount-Trans-Docs/docs/06-版本更新日志.md'
        ],
        message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}'
      }
    ],
    [
      '@semantic-release/github',
      {
        successComment: false
      }
    ]
  ]
};

export default config;
