const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.REGION
});
const ssm = new AWS.SSM();

const getSecret = async (name) => {
  const result = await ssm
    .getParameter({
      Name: name,
      WithDecryption: true
    })
    .promise();
  return Promise.resolve(result.Parameter.Value);
};

const getConfig = async () => {
  if (process.env.STAGE !== 'local') {
    const mysqluri = await getSecret(`${process.env.STACK}/application-mysqluri`);
    return Promise.resolve(mysqluri);
  }
  return Promise.resolve(process.env.DB_URI);
};

module.exports = {
  getConfig
};