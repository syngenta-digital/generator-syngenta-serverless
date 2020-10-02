const dynamodb = require('../../helpers/dynamodb');

const _init = async (_this) => {
    return _this.prompt([
      {
        type    : 'input',
        name    : 'db_name',
        message : `\n\n========================== CREATING DYNAMODB RESOURCE ==========================\n\nWhat would you like your Dynamo DB name to be?`
      }
    ])
}

const _addDDB = async (args) => {
    await dynamodb.init(args);
}

exports.handler = async _this => {
  const args = await _init(_this);
  return _addDDB(args);
}