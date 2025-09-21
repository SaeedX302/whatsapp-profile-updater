module.exports = {
  // This is the crucial part: by default, Jest ignores node_modules.
  // We are telling it to NOT ignore the baileys and boom packages so they can be transformed by Babel.
  transformIgnorePatterns: [
    "/node_modules/(?!(@whiskeysockets/baileys|@hapi/boom))/"
  ],
  testTimeout: 30000,
};
