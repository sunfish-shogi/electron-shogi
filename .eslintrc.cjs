module.exports = {
  env: {
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended",
    "@vue/typescript/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "@vue/prettier",
    "@vue/eslint-config-prettier",
    "@vue/eslint-config-typescript",
    "prettier",
  ],
  rules: {
    "no-console": "error",
    "no-debugger": "error",
    "no-restricted-imports": ["error", { patterns: ["../"] }],
    "no-irregular-whitespace": "off",
    "vue/multi-word-component-names": "off",
    "import/no-cycle": 1,
  },
  settings: {
    "import/resolver": {
      typescript: true,
    },
  },
};
