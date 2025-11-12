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
      '@semantic-release/git',
      {
        assets: ['package.json', 'package-lock.json'],
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
