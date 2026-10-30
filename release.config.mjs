import conventionalcommits from 'conventional-changelog-conventionalcommits';

// semantic-release reads preset.parser (v8+ shape); v7 still exports parserOpts.
// Do not pass writerOpts: v7's transform mutates commits, writer@8 freezes them.
const { parserOpts } = await conventionalcommits();

const config = {
	branches: ['main'],
	// Match n8n publish.yml tag filter `*.*.*` (no `v` prefix).
	tagFormat: '${version}',
	plugins: [
		['@semantic-release/commit-analyzer', { preset: 'conventionalcommits', parserOpts }],
		['@semantic-release/release-notes-generator', { preset: 'conventionalcommits', parserOpts }],
		[
			'@semantic-release/changelog',
			{
				changelogFile: 'CHANGELOG.md',
			},
		],
		[
			'@semantic-release/npm',
			{
				// npm publish with provenance runs in CI after this step (n8n verification).
				npmPublish: false,
			},
		],
		[
			'@semantic-release/git',
			{
				assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
				message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
			},
		],
		'@semantic-release/github',
		[
			'@semantic-release/exec',
			{
				successCmd: 'echo -n ${nextRelease.version} > .released-version',
			},
		],
	],
};

export default config;
