const antfu = require('@antfu/eslint-config').default;
const unusedImports = require('eslint-plugin-unused-imports');
const regEx = require('eslint-plugin-regex');
const prettier = require('eslint-config-prettier');

module.exports = antfu(
	{
		stylistic: {
			semi: true,
			indent: 'tab',
			quotes: 'single',
		},
		yaml: false,
		markdown: false,
		ignores: [
			'**/jest.config.ts',
			'*.json',
			'tsconfig.*.json',
			'node_modules',
			'tslint.json',
			'**/*.js',
			'src/test.ts',
			'*.js',
			'*.md',
			'**/server.js',
			'**/app.js',
			'README.md',
			'changelog.md',
		],
		typescript: true,
		jsonc: false,
		overrides: {
			typescript: true,
			yaml: false,
			markdown: false,
			plugins: {
				...prettier,
				regEx: {
					rules: {
						...regEx,
					},
				},
				angular: {
					rules: {
						'@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
						'@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
					},
				},
				unusedImports: {
					rules: [unusedImports],
				},
			},
		},
		rules: {
			'no-var': 'off',
			'style/eol-last': 'off',
			'style/arrow-parens': 'off',
			'antfu/if-newline': 'off',
			'style/binary-ops': 'off',
			'style/indent-operator-linebreak': 'off',
			'style/operator-linebreak': ['off', 'before', { overrides: { '||': 'after', '&&': 'after' } }],
			'prefer-arrow-callback': 0,
			'array-bracket-spacing': 1,
			indent: ['error', 'tab', { ignoredNodes: ['PropertyDefinition'] }],
			semi: 'error',
			'style/semi': 'error',
			'max-len': ['error', 120],
			'style/jsx-quotes': 'error',
			'antfu/consistent-list-newline': 'error',
			'no-trailing-spaces': 'error',
			'no-console': 'error',
			'no-alert': 'error',
			'node/no-path-concat': 'off',
			quotes: ['error', 'single'],
			'dot-notation': 'off',
			'style/brace-style': 'off',
			'no-unused-vars': 'off', // or "@typescript-eslint/no-unused-vars": "off",
			'unused-imports/no-unused-imports': 'error',
			'node/prefer-global/process': 'off',
			'unused-imports/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_',
				},
			],
		},
	},
	{
		plugins: {
			regEx: {
				rules: {
					...prettier,
					...regEx,
				},
			},
			angular: {
				rules: {
					'@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
					'@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
				},
			},
			...unusedImports,
		},
		rules: {
			'prefer-arrow-callback': 0,
			'array-bracket-spacing': 1,
			indent: ['error', 'tab', { ignoredNodes: ['PropertyDefinition'] }],
			semi: 'error',
			'style/semi': 'error',
			'max-len': ['error', 120],
			'style/jsx-quotes': 'error',
			'antfu/consistent-list-newline': 'error',
			'no-trailing-spaces': 'error',
			'no-console': 'error',
			'no-alert': 'error',
			quotes: ['error', 'single'],
			'no-unused-vars': 'off', // or "@typescript-eslint/no-unused-vars": "off",
			'unused-imports/no-unused-imports': 'error',
			'node/prefer-global/process': 'off',
			'node/no-path-concat': 'off',
			'unused-imports/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_',
				},
			],
		},
		ignores: [
			'**/jest.config.ts',
			'*.json',
			'tsconfig.*.json',
			'node_modules',
			'./tslint.json',
			'./src/assets/**/*.js',
			'*.js',
			'*.md',
			'**/app.js',
			'**/server.js',
			'README.md',
			'changelog.md',
		],
	},
);