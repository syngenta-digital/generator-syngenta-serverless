const { versions_string } = require('../helpers/runtimes');

exports.default = (_this) => {
    return _this.prompt([
      {
        type    : 'input',
        name    : 'runtime',
        message : `What runtime would you like this project to be? (example: node, python, java. default: node)`
      },
      {
        type    : 'input',
        name    : 'runtime_version',
        message : `What runtime version would you like?\n\nsupported: ${versions_string}\n\n(default: latest stable version)\n\n`
      },
      {
        type    : 'input',
        name    : 'app',
        message : `What would you like to call your serverless app?`
      },
      {
        type    : 'input',
        name    : 'service',
        message : `What would you like to call your serverless service?`
      }
    ])
}