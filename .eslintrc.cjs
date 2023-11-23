module.exports = {
  env: {
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended",
    "@vue/typescript/recommended",
    "@vue/prettier",
    "@vue/eslint-config-prettier",
    "@vue/eslint-config-typescript",
    "prettier",
  ],
  rules: {
    "no-console": "error",
    "no-debugger": "error",
    "no-irregular-whitespace": "off",
    "vue/multi-word-component-names": "off",
  },
};
