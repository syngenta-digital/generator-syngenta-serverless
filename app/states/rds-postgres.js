const rds_postgres = require('../../helpers/rds-postgres');
// await rds_mysql.init({db_name, api_name: db_name, engine: 'mysql'});
const _init = async (_this) => {
    return _this.prompt([
      {
        type    : 'input',
        name    : 'db_name',
        message : `\n\n========================== CREATING RDS-POSTGRES RESOURCE ==========================\n\nWhat would you like your Postgres DB name to be?`
      }
    ])
}

const _addRdsPostGres = async (args) => {
    await await rds_postgres.init({ ...args, engine: 'postgres'});
}

exports.handler = async _this => {
  const args = await _init(_this);
  const formatted_api_name = _this._syngenta_app && _this._syngenta_service ? `${_this._syngenta_app}-${_this._syngenta_service}` : `${this.appname}`;
  return _addRdsPostGres({...args, api_name: `${formatted_api_name}`});
}