module.exports = {
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: true
	},
	env: {
		es6: true
	},
	plugins: [
		'@typescript-eslint',
		// 'functional',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		// 'plugin:functional/external-typescript-recommended',
		// 'plugin:functional/recommended',
		// 'plugin:functional/stylistic',
		'stop'
	],
	rules: {
		'@typescript-eslint/no-unused-vars': 'off',
	}
}
