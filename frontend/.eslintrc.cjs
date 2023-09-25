module.exports = {
    extends: [
      "plugin:astro/recommended",
      "plugin:react-hooks/recommended"
    ],
    overrides: [
      {
        files: ["*.astro"],
        parser: "astro-eslint-parser",
        parserOptions: {
          parser: "@typescript-eslint/parser",
          extraFileExtensions: [".astro"],
        },
        rules: {
        },
      },
    ],
  }