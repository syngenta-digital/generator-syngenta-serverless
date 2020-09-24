exports.default = `const mysql = require('mysql');
const ssm = require('./ssm');
const getConnection = async () => {
  const mysqluri = await ssm.getConfig();
  const connection = await mysql.createConnection(mysqluri);
  await connection.connect();
  return Promise.resolve(connection);
};

module.exports = {
  getConnection
};`

