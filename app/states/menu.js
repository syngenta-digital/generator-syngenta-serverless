exports.default = (_this) => {
    return _this.prompt([
      // {
      //   type    : 'input',
      //   name    : 'app',
      //   message : `What would you like to call your serverless app?`
      // },
      // {
      //   type    : 'input',
      //   name    : 'service',
      //   message : `What would you like to call your serverless service?`
      // },
      {
        type    : 'input',
        name    : 'services',
        message : `Which service do you want to add to your serverless project \n\n\n Available Services: apigateway, s3, sns, sqs (comma seperated for multiple):\n`
      }
    ])
}