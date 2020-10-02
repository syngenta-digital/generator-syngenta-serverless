const serverless_helper = require('../../helpers/serverless');

const _init = async (_this) => {
    return _this.prompt([
      {
        type    : 'input',
        name    : 'domain_name',
        message : `\n\n========================== CREATING APIGATEWAY RESOURCE ==========================\n\n(optional) What is the domain name (default: syndpe.com)`
      },
      {
        type    : 'input',
        name    : 'custom_uri_suffix',
        message : `(optional) Custom URI Suffix (appears after stage, example: \`dev-api.domain-name\`):)`
      }
    ])
}

const _addApiGateway = async (args) => {
    const _args = {};
    for(const [key, value] of Object.entries(args)) {
        if(value && typeof value === "string" && value.length > 0) _args[key] = value;
    }
    return serverless_helper.addResources(['apigateway'], _args);
}

exports.handler = async _this => {
  const args = await _init(_this);
  return _addApiGateway(args);
}