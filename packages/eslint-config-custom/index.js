module.exports = {
  extends: [
    "next/core-web-vitals",
    "plugin:@tanstack/eslint-plugin-query/recommended",
  ],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
};
