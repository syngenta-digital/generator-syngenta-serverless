const fs = require('fs');
const AWS = require('aws-sdk');

const s3config =
    process.env.STAGE === 'local'
        ? {
              accessKeyId: 'S3RVER',
              secretAccessKey: 'S3RVER',
              s3ForcePathStyle: true,
              endpoint: new AWS.Endpoint('http://localhost:8000')
          }
        : {};

const S3 = new AWS.S3(s3config);

exports.put = async (object_name, file_location, bucket, content_type) => {
    if (!object_name || !file_location || !bucket || !content_type)
        throw new Error('required s3 put parameters not supplied: object_name, file_location, bucket, content_type');
    const file_content = fs.readFileSync(file_location);
    const params = {
        Key: object_name,
        Body: file_content,
        Bucket: bucket,
        ContentType: content_type
    };
    const response = await S3.upload(params).promise();
    return response;
};

exports.putRaw = async (object_name, buffer, bucket, content_type) => {
    if (!object_name || !buffer || !bucket || !content_type)
        throw new Error('required s3 put parameters not supplied: object_name, buffer, bucket, content_type');
    const params = {
        Key: object_name,
        Body: buffer,
        Bucket: bucket,
        ContentType: content_type
    };
    const response = await S3.upload(params).promise();
    return response;
};

exports.get = (bucket_name, key_name, save_location) =>
    new Promise(async (resolve) => {
        const params = {
            Bucket: bucket_name,
            Key: key_name
        };
        if (save_location) {
            const file = fs.createWriteStream(save_location);
            const stream = S3.getObject(params)
                .createReadStream()
                .on('error', function (err) {
                    console.log('logging error', err);
                    resolve();
                })
                .pipe(file);

            stream.on('finish', function () {
                resolve();
            });
        } else {
            const data = await S3.getObject(params).promise();
            resolve(data);
        }
    });
