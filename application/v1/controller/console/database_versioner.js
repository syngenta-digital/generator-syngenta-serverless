const versioner = require('syngenta-database-versioner');

const _displayLocalOutputs = (params) => {
  console.log(params);
  return process.exit(0);
};

exports.apply = async () => {
  const params = await versioner.apply({
    engine: 'neo4j',
    host: process.env.NEO4J_HOST,
    masterUser: process.env.NEO4J_USER,
    masterPassword: process.env.NEO4J_PASSWORD,
    stack: process.env.STACK,
    region: process.env.REGION,
    versionsDirectory: 'db_versions',
    useSSM: process.env.STAGE !== 'local'
  });
  return process.env.STAGE === 'local' ? _displayLocalOutputs(params) : {
    completed: true,
    params
  };
};
