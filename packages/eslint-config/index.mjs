/** Shared project-specific rules layered onto the root flat ESLint configuration. */
export const ursaiRules = {
  '@typescript-eslint/consistent-type-imports': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
};
