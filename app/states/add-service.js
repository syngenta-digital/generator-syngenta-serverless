exports.default = (_this) => {
    return _this.prompt([
      {
        type    : 'input',
        name    : 'services',
        message : `Which service do you want to add to your serverless project \n\n\n Available Services: 'apigateway', 's3', 'sns', 'sqs' (comma seperated for multiple):\n\n`
      }
    ])
}