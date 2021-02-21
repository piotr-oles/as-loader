module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["plugin:node/recommended", "prettier"],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  settings: {
    node: {
      tryExtensions: [".js", ".json", ".ts", ".d.ts"],
    },
  },
  overrides: [
    {
      files: ["*.ts"],
      extends: ["plugin:@typescript-eslint/recommended", "prettier"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "node/no-unsupported-features/es-syntax": "off",
      },
    },
    {
      files: ["*.spec.ts"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "node/no-missing-import": "off",
      },
    },
  ],
};
