const sorcery = require('sorcery');

const argv = require('yargs')
  .alias('f', 'file')
  .argv;

sorcery.load(argv.file).then(function (chain) {
  chain.write();
});
