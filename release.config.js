export default {
  branches: ['main'],
  repositoryUrl: 'https://github.com/dhr2333/Beancount-Trans',
  tagFormat: 'v${version}',
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
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'node scripts/update-version.js ${nextRelease.version}'
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: [
          'CHANGELOG.md',
          'package.json',
          'Beancount-Trans-Frontend/package.json',
          'Beancount-Trans-Docs/package.json',
          'Beancount-Trans-Docs/docs/07-版本更新日志/*.md'
        ],
        message:
          'chore(release): v${nextRelease.version}\n\n${nextRelease.notes}'
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

