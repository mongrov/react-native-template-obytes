import path from 'node:path';
import { fileURLToPath } from 'node:url';

import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import i18nJsonPlugin from 'eslint-plugin-i18n-json';
import reactCompiler from 'eslint-plugin-react-compiler';
import testingLibrary from 'eslint-plugin-testing-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Node < 20.11 may not have `Object.groupBy`, but some ESLint flat-config utilities expect it.
// Polyfill it *before* loading `@antfu/eslint-config`.
if (typeof Object.groupBy !== 'function') {
  Object.groupBy = function groupBy(items, callbackFn) {
    if (items == null)
      throw new TypeError('Object.groupBy called on null or undefined');
    if (typeof callbackFn !== 'function')
      throw new TypeError('callbackFn must be a function');

    const result = {};
    for (const item of items) {
      const key = callbackFn(item);
      const k = String(key);
      (result[k] ??= []).push(item);
    }
    return result;
  };
}

const { default: antfu } = await import('@antfu/eslint-config');

export default antfu(
  {
    // Enable React and TypeScript support
    react: true,
    typescript: true,

    // Disable JSON processing for translation files (handled by i18n-json plugin)
    jsonc: false,

    // Use ESLint Stylistic for formatting
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: true,
    },

    // Global ignores
    ignores: [
      '**/*.d.ts',
      '**/*.md',
      'dist/*',
      'node_modules',
      'vendor',
      'vendor/**',
      'src/lib/rxdb/rxdb-premium',
      'src/lib/rxdb/rxdb-premium/**',
      '__tests__/',
      '__mocks__/',
      'coverage',
      '.expo',
      '.expo-shared',
      '.github/',
      'src/app/(app)/chat/**',
      'src/lib/collab/**',
      'src/lib/collab/adapters/__tests__/**',
      'android',
      'ios',
      '.vscode',
      'docs/',
      'cli/',
      'expo-env.d.ts',
      'migration/*',
    ],
  },

  // Custom rules
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'max-params': ['warn', 4],
      'max-lines-per-function': 'off',
      // The template ships with very strict style/import-order rules that are noisy in RN screens.
      // Keep correctness rules on, but relax formatting-only rules to avoid blocking commits.
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-named-imports': 'off',
      'style/indent': 'off',
      'style/multiline-ternary': 'off',
      'style/arrow-parens': 'off',
      'style/comma-dangle': 'off',
      'style/brace-style': 'off',
      'antfu/if-newline': 'off',
      'ts/consistent-type-definitions': 'off',
      'import/consistent-type-specifier-style': 'off',
      'perfectionist/sort-exports': 'off',
      'perfectionist/sort-named-exports': 'off',
      'e18e/prefer-static-regex': 'off',
      'e18e/prefer-timer-args': 'off',
      'react/no-nested-component-definitions': 'off',
      'prefer-arrow-callback': 'off',
      'style/key-spacing': 'off',
      'style/no-multi-spaces': 'off',
      'style/indent-binary-ops': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-compiler/react-compiler': 'off',
      'react/display-name': 'off',
      'react/no-inline-styles': 'off',
      'react/destructuring-assignment': 'off',
      'react/require-default-props': 'off',
      'react-refresh/only-export-components': 'warn', // Too strict for React Native
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: [
            '/android',
            '/ios',
            'README.md',
            'README-project.md',
            'ISSUE_TEMPLATE.md',
            'PULL_REQUEST_TEMPLATE.md',
          ],
        },
      ],
      'node/prefer-global/process': 'off', // process is commonly used in React Native configs
      'ts/no-require-imports': 'off', // Sometimes needed for mocks
      'ts/no-use-before-define': 'off', // Allow forward references in React components
      'no-console': 'off', // Console is useful for debugging
      'no-cond-assign': 'off', // Allow assignment in conditions when intentional
      'regexp/no-super-linear-backtracking': 'off', // Relax regex performance rules
      'regexp/no-unused-capturing-group': 'off', // Allow unused capturing groups
      'react-hooks/set-state-in-effect': 'off', // Standard pattern: setState in async effects is fine
    },
  },

  // Markdown files are linted via a processor; some core JS rules can crash there.
  {
    files: ['**/*.md'],
    rules: {
      'max-lines-per-function': 'off',
    },
  },

  // TypeScript-specific rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'ts/consistent-type-definitions': 'off',
      'react-hooks/refs': 'off', // Allow useRef without exhaustive-deps
      'ts/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
    },
  },

  // Better TailwindCSS plugin
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...betterTailwindcss.configs.recommended,
    settings: {
      'better-tailwindcss': {
        entryPoint: path.resolve(__dirname, './src/global.css'),
      },
    },
    rules: {
      ...betterTailwindcss.configs.recommended.rules,
      'better-tailwindcss/no-unnecessary-whitespace': 'warn',
      'better-tailwindcss/no-unknown-classes': 'warn',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off', // Can be too strict for some cases
    },
  },

  // React Compiler plugin
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'off',
    },
  },

  // i18n JSON validation
  {
    files: ['src/translations/*.json'],
    plugins: { 'i18n-json': i18nJsonPlugin },
    processor: {
      meta: { name: '.json' },
      ...i18nJsonPlugin.processors['.json'],
    },
    rules: {
      ...i18nJsonPlugin.configs.recommended.rules,
      'i18n-json/valid-message-syntax': [
        2,
        {
          syntax: path.resolve(
            __dirname,
            './scripts/i18next-syntax-validation.js',
          ),
        },
      ],
      'i18n-json/valid-json': 2,
      'i18n-json/sorted-keys': [2, { order: 'asc', indentSpaces: 2 }],
      'i18n-json/identical-keys': [
        2,
        { filePath: path.resolve(__dirname, './src/translations/en.json') },
      ],
      // Disable conflicting rules for i18n JSON files
      'style/semi': 'off',
      'style/comma-dangle': 'off',
      'style/quotes': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },

  // Testing Library rules
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)', '**/tests/**/*.[jt]s?(x)'],
    plugins: { 'testing-library': testingLibrary },
    rules: {
      ...testingLibrary.configs.react.rules,
      'max-lines-per-function': 'off',
    },
  },
);
