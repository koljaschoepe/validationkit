// Flat-config for Next.js 16 monorepo (ESLint v9).
// Replaces `next lint` (removed in Next 16) using `eslint-config-next` flat exports.

import tseslint from 'typescript-eslint';
import nextConfig from 'eslint-config-next';
import js from '@eslint/js';

export default [
  // Global ignores.
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.vercel/**',
      'packages/db/drizzle/meta/**',
      '**/*.d.ts',
    ],
  },

  // Base JS + TS recommended.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Loosen the strictest TS rules — repo is already strict via tsconfig + audit
  // showed 0 @ts-ignore in production code. Lint shouldn't fail on type-narrowing
  // patterns that tsc already accepts.
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-undef': 'off',
    },
  },

  // Next.js core-web-vitals + typescript — only applies to apps/web.
  ...nextConfig.map((config) => ({
    ...config,
    files: config.files
      ? config.files.map((p) => `apps/web/${p.replace(/^\*\*\//, '')}`)
      : ['apps/web/**/*.{ts,tsx,js,jsx}'],
  })),

  // Tests + scripts — relax some rules.
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'eval/**', 'scripts/**'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];
