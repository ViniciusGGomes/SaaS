/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@rockeatseat/eslint-config/node'],
  plugins: ['simple-import-sort'],
  rules: {
    'simple-import-sort/imports': 'error',
  },
}
