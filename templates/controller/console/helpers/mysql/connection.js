const mysql = require('mysql');
const util = require('util');

const connect = async (uri) => {
  const connection = await mysql.createConnection(uri);
  const query = await util.promisify(connection.query).bind(connection);
  return Promise.resolve(query);
};

module.exports = {connect};
