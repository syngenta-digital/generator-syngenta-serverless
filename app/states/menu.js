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
      // {
      //   type    : 'input',
      //   name    : 'services',
      //   message : `Which service do you want to add to your serverless project \n\n\n Available Services: apigateway, s3, sns, sqs (comma seperated for multiple):\n`
      // }
      {
        type    : 'input',
        name    : 'menu',
        message : `========================== \n\n What would you like to do? \n\n ========================== \n Type the corresponding number and press enter:\n\n 1) Add service \n 2) Finish \n 3) Dismiss changes\n\n`
      }
    ])
}