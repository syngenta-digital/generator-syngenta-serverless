exports.default = (_this) => {
    return _this.prompt([
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