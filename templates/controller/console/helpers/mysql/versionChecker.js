const connection = require('./connection');
const ssmInterface = require('./ssmInterface');

const _randomString = async () => {
  return Promise.resolve(
    Math.random()
      .toString(36)
      .substring(2, 15) +
      Math.random()
        .toString(36)
        .substring(2, 15)
  );
};

const _generatePasswords = async (params) => {
  params.appPassword = await _randomString();
  params.versionPassword = await _randomString();
  params.destroyPassword = await _randomString();
  return Promise.resolve(true);
};

const _generateUris = async (params) => {
  params.appURI = `mysql://${params.appUsername}:${params.appPassword}@${params.host}:3306/${params.appDB}`;
  params.versionURI = `mysql://versioner:${params.versionPassword}@${params.host}:3306/db_versions`;
  params.versionAppURI = `mysql://versioner:${params.versionPassword}@${params.host}:3306/${params.appDB}`;
  params.builderURI = `mysql://${params.masterUser}:${params.masterPassword}@${params.host}:3306/`;
  return Promise.resolve(true);
};

const _getMasterConnection = async (params) => {
  params.appURI = `mysql://${params.masterUser}:${params.masterPassword}@${params.host}:3306/${params.appDB}`;
  params.versionURI = `mysql://${params.masterUser}:${params.masterPassword}@${params.host}:3306/db_versions`;
  params.versionAppURI = `mysql://${params.masterUser}:${params.masterPassword}@${params.host}:3306/${params.appDB}`;
  params.builderURI = `mysql://${params.masterUser}:${params.masterPassword}@${params.host}:3306/`;
  return Promise.resolve(true);
};

const _getSSMConnection = async (params) => {
  params.appURI = await ssmInterface.download(`/${params.stack}/application-mysqluri`);
  params.versionURI = await ssmInterface.download(`/${params.stack}/versioner-mysqluri`);
  params.versionAppURI = await ssmInterface.download(`/${params.stack}/versioner-application-mysqluri`);
  return Promise.resolve(true);
};

const _getUris = async (params) => {
  if (params.useSSM) {
    await _getSSMConnection(params);
  } else {
    await _getMasterConnection(params);
  }
  return Promise.resolve(true);
};

exports.check = async (params) => {
  console.log('CHECKING VERSION');
  await _getUris(params);
  try {
    const query = await connection.connect(params.versionURI);
    const results = await query('SELECT * FROM Versions');
    console.log('CURRENT VERSION: ', results.length ? results[results.length - 1].version_file : 0);
    params.dbsBuilt = true;
  } catch (error) {
    console.log('CURRENT VERSION: INITIAL DEPLOYMENT');
    params.dbsBuilt = false;
    if (params.useSSM) {
      await _generatePasswords(params);
      await _generateUris(params);
      await ssmInterface.upload(params);
    }
  }
};
