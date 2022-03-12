module.exports = {
  ignorePatterns: ['dist', 'node_modules'],
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
  ],
  parserOptions: {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  rules: {
    quotes: ['off', "single"],
    'no-unused-vars': ['warning', { argsIgnorePattern: '^_' }],
  },
  settings: { 'import/resolver': 'webpack' },
};
