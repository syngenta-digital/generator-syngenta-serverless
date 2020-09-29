const s3 = require('../../helpers/s3');

exports.default = (_this) => {
    return _this.prompt([
      {
        type    : 'input',
        name    : 'bucket_name',
        message : `What would you like your S3 bucket name to be?`
      },
      {
        type    : 'input',
        name    : 'is_public',
        message : `Do you want this to be a public policy bucket?`
      }
    ])
}

const _addBucket = async (args) => {
    return s3.init({
      bucket_name: args.bucket_name,
      isPublic: args.is_public
  })
}

exports.handler = async args => {
  return _addBucket(args);
}