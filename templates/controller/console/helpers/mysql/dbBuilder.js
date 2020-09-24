const connection = require('./connection')

const _getSQLStatements = async (params, dbType, destroyPassword) => {
  let statements = []
  if (dbType === 'application') {
    statements = [
      `CREATE DATABASE IF NOT EXISTS ${params.appDB};`,
      `GRANT SHOW VIEW, CREATE, SELECT, DELETE, TRIGGER, EXECUTE, INSERT, UPDATE ON ${params.appDB}.* TO ${params.appUsername}@'%' IDENTIFIED BY '${params.appPassword}';`,
      'FLUSH PRIVILEGES',
      `UPDATE mysql.user SET authentication_string = PASSWORD('${params.appPassword}') WHERE User = '${params.appUsername}' AND Host = '%';`,
      'FLUSH PRIVILEGES'
    ]
  } else {
    statements = [
      'CREATE DATABASE IF NOT EXISTS db_versions;',
      'CREATE TABLE IF NOT EXISTS db_versions.Versions (`version_file` varchar(255) DEFAULT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8',
      `GRANT ALL ON db_versions.* TO 'versioner'@'%' IDENTIFIED BY '${params.versionPassword}';`,
      'FLUSH PRIVILEGES',
      `GRANT ALL ON ${params.appDB}.* TO 'versioner'@'%' IDENTIFIED BY '${params.versionPassword}';`,
      'FLUSH PRIVILEGES',
      `UPDATE mysql.user SET authentication_string = PASSWORD('${params.versionPassword}') WHERE User = 'versioner' AND Host = '%';`,
      'FLUSH PRIVILEGES'
    ]
  }
  if (params.useSSM && destroyPassword) {
    statements.push(
      `UPDATE mysql.user SET authentication_string = PASSWORD('${params.destroyPassword}') WHERE User = '${params.masterUser}' AND Host = '%';`
    )
    statements.push('FLUSH PRIVILEGES')
  }
  return statements
}

const build = async (params, dbType, destroyPassword = false) => {
  if (params.dbsBuilt) {
    console.log(`BUILDING DATABASE: ${dbType} ALREADY BUILT`)
  } else {
    console.log(`BUILDING DATABASE: ${dbType}`)
    const statements = await _getSQLStatements(
      params,
      dbType,
      destroyPassword
    )
    const query = await connection.connect(params.builderURI)
    for (const statement of statements) {
      console.log(`BUILDER ATTEMPTING: ${statement}`)
      await query(statement)
    }
  }
  return Promise.resolve(params)
}

module.exports = { build }
