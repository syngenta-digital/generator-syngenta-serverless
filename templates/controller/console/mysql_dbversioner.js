const file = require('../../../helpers/file');

const template = (versions_path = `${file.root()}db_versions`) => `// this has been taken from a shared package and edited for this app
// original package (syngenta-mysql-versioner): https://github.com/syngenta-dpe-usco/package-node-mysql-versioner
const versioner = require('./helpers/mysql-versioner');

exports.applyVersion = async (event) => {
  await versioner.apply({
    stack: process.env.STACK,
    region: process.env.REGION,
    host: process.env.DB_HOST,
    masterUser: process.env.DB_MASTER_USER,
    masterPassword: process.env.DB_MASTER_PASS,
    appDB: process.env.DB_NAME,
    appUsername: process.env.DB_APP_USER,
    // TODO: this need to be at root level of project under db_versions
    versionsDirectory: '${versions_path}',
    useSSM: process.env.STAGE !== 'local'
  });
  return process.env.STAGE === 'local' ? process.exit(0) : Promise.resolve(event);
};`

exports.default = template;