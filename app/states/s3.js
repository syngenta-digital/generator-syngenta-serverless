const s3 = require('../../helpers/s3');
const { acceptableBoolean } = require('../helpers/boolean');

const _init = async (_this) => {
    return _this.prompt([
      {
        type    : 'input',
        name    : 'bucket_name',
        message : `\n\n========================== CREATING S3 RESOURCE ==========================\n\nWhat would you like your S3 bucket name to be?`
      },
      {
        type    : 'input',
        name    : 'is_public',
        message : `Do you want this to be a public policy bucket?`
      }
    ])
}

const _addBucket = async (args) => {
  const _is_public = acceptableBoolean(args.is_public);
    await s3.init({
        bucket_name: args.bucket_name,
        isPublic: _is_public
    })
}

exports.handler = async _this => {
  const args = await _init(_this);
  return _addBucket(args);
}