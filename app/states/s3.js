const s3 = require('../../helpers/s3');

const _init = async (_this) => {
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
    await s3.init({
        bucket_name: args.bucket_name,
        isPublic: args.is_public
    })
}

exports.handler = async _this => {
  const args = await _init(_this);
  return _addBucket(args);
}