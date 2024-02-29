// prettier.config.js, .prettierrc.js, prettier.config.cjs, or .prettierrc.cjs

/** @type {import("prettier").Options} */
const config = {
singleQuote: true,
trailingComma: 'es5',
tabWidth: 2,
semi: true,
plugins: ['prettier-plugin-organize-imports'],
};

module.exports = config;