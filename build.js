"use strict";

const shell = require('shelljs');
const chalk = require('chalk');

const PACKAGE = `ngx-image-cropper`;
const NPM_DIR = `dist`;
const MODULES_DIR = `${NPM_DIR}/modules`;
const BUNDLES_DIR = `${NPM_DIR}/bundles`;

shell.echo(`Start building...`);

shell.rm(`-Rf`, `${NPM_DIR}/*`);
shell.mkdir(`-p`, `./${MODULES_DIR}`);
shell.mkdir(`-p`, `./${BUNDLES_DIR}`);

/* TSLint with Codelyzer */
// https://github.com/palantir/tslint/blob/master/src/configs/recommended.ts
// https://github.com/mgechev/codelyzer
shell.echo(`Start TSLint`);
shell.exec(`tslint -c tslint.json -t stylish src/**/*.ts`);
shell.echo(chalk.green(`TSLint completed`));

/* AoT compilation: ES2015 sources */
shell.echo(`Start AoT compilation`);
if (shell.exec(`ngc -p tsconfig-build.json`).code !== 0) {
    shell.echo(chalk.red(`Error: AoT compilation failed`));
    shell.exit(1);
}
shell.echo(chalk.green(`AoT compilation completed`));

/* Creates bundles: ESM/ES5 and UMD bundles */
shell.echo(`Start bundling`);
shell.echo(`Rollup package`);
shell.exec(`rollup -i ${NPM_DIR}/${PACKAGE}.js -o ${MODULES_DIR}/${PACKAGE}.js --sourcemap`, { silent: true });
shell.exec(`node scripts/map-sources -f ${MODULES_DIR}/${PACKAGE}.js`);

shell.echo(`Downleveling ES2015 to ESM/ES5`);
shell.cp(`${MODULES_DIR}/${PACKAGE}.js`, `${MODULES_DIR}/${PACKAGE}.es5.ts`);
shell.exec(`tsc ${MODULES_DIR}/${PACKAGE}.es5.ts --target es5 --module es2015 --noLib --sourceMap`, { silent: true });
shell.exec(`node scripts/map-sources -f ${MODULES_DIR}/${PACKAGE}.es5.js`);
shell.rm(`-f`, `${MODULES_DIR}/${PACKAGE}.es5.ts`);

shell.echo(`Run Rollup conversion on package`);
if (shell.exec(`rollup -c rollup.config.js --sourcemap`).code !== 0) {
    shell.echo(chalk.red(`Error: Rollup conversion failed`));
    shell.exit(1);
}
shell.exec(`node scripts/map-sources -f ${BUNDLES_DIR}/${PACKAGE}.umd.js`);

shell.echo(`Minifying`);
shell.cd(`${BUNDLES_DIR}`);
shell.exec(`uglifyjs -c warnings=false --screw-ie8 --comments -o ${PACKAGE}.umd.min.js --source-map ${PACKAGE}.umd.min.js.map --source-map-include-sources ${PACKAGE}.umd.js`);
shell.exec(`node ../../scripts/map-sources -f ${PACKAGE}.umd.min.js`);
shell.cd(`..`);
shell.cd(`..`);

shell.echo(chalk.green(`Bundling completed`));

shell.rm(`-Rf`, `${NPM_DIR}/*.js`);
shell.rm(`-Rf`, `${NPM_DIR}/*.js.map`);
shell.rm(`-Rf`, `${NPM_DIR}/src/**/*.js`);
shell.rm(`-Rf`, `${NPM_DIR}/src/**/*.js.map`);

shell.cp(`-Rf`, [`package.json`, `LICENSE`, `README.md`], `${NPM_DIR}`);

shell.echo(chalk.green(`End building`));
