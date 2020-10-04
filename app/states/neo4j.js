const neo4j = require('../../helpers/neo4j');

const _init = async (_this) => {
    return _this.prompt([
      {
        type    : 'input',
        name    : 'bucket_name',
        message : `\n\n========================== CREATING NEO4J RESOURCE ==========================\n\nWhat would you like your Neo4J DB name to be?`
      }
    ])
}

const _addNeo4j = async (args) => {
  await neo4j.init();
}

exports.handler = async _this => {
  const args = await _init(_this);
  return _addNeo4j(args);
}