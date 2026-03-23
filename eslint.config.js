import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			'svelte/no-at-html-tags': 'off',
			'no-unused-vars': ['warn', { varsIgnorePattern: '^_' }]
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/']
	}
];
