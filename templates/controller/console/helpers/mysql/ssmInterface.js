const AWS = require('aws-sdk');

const ssm = new AWS.SSM();

const _getUploadParams = async (params) => {
  return [
    {
      Name: `/${params.stack}/application-mysqluri`,
      Value: params.appURI,
      Type: 'SecureString',
      Overwrite: true
    },
    {
      Name: `/${params.stack}/versioner-mysqluri`,
      Value: params.versionURI,
      Type: 'SecureString',
      Overwrite: true
    },
    {
      Name: `/${params.stack}/versioner-application-mysqluri`,
      Value: params.versionAppURI,
      Type: 'SecureString',
      Overwrite: true
    }
  ];
};

const upload = async (params) => {
  console.log('SSM Interface: UPLOADING');
  const ssmParams = await _getUploadParams(params);
  if (params.useSSM) {
    await AWS.config.update({region: params.region});
    for (const ssmParam of ssmParams) {
      await ssm.putParameter(ssmParam).promise();
    }
    console.log('SSM Interface: UPLOADED');
  } else {
    console.log('SSM Interface: UPLOAD SKIPPED');
  }
  return Promise.resolve(true);
};

const download = async (paramName) => {
  console.log('SSM Interface: DOWNLOADING');
  try {
    const result = await ssm
      .getParameter({
        Name: paramName,
        WithDecryption: true
      })
      .promise();
    if (result) {
      return result.Parameter.Value;
    }
  } catch (error) {
    console.log(error);
  }
  return false;
};

module.exports = {upload, download};
