import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['lib/**', 'node_modules/**']
  },
  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
        // For type-aware rules, add:
        // project: ['./tsconfig.json', './tsconfig.jest.json'],
        // tsconfigRootDir: new URL('.', import.meta.url)
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      // Keep rules minimal and non-disruptive; extend as needed
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
];

