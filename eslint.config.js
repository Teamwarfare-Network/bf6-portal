import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        ignores: ['node_modules/**', '**/node_modules/**', '**/dist/**', 'bf6-portal/**'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
    {
        files: ['dev/**/*.ts'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
        },
        rules: {
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    args: 'none',
                },
            ],
            '@typescript-eslint/ban-ts-comment': 'off',
            'no-undef': 'off',
            'prefer-const': 'warn',
            'no-prototype-builtins': 'warn',
            'no-empty': 'warn',
            'no-debugger': 'warn',
            'no-case-declarations': 'warn',
        },
    },
    {
        files: ['dev/*/scripts/**/*.js', 'scripts/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                URL: 'readonly',
                setTimeout: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            'no-undef': 'off',
        },
    },
];
