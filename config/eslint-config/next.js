/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ["@rockeatseat/eslint-config/next"],
  plugins: ["simple-import-sort"],
  rules: {
    "simple-import-sort/imports": "error",
  },
};
