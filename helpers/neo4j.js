const path = require('path');
const file = require('./file');
const serverless_helper = require('../helpers/serverless');
const packagejson_helper = require('../helpers/package-json');
const neo4j_local_template = require('../templates/aws/local/neo4j');
const formatter = require('esformatter');
const { default: local_env_template } = require('../templates/aws/envs/local');
const { default: versioner_template } = require('../templates/controller/console/neo4j_dbversioner');
const { default: neo4j } = require('../templates/aws/local/neo4j');
const { addPackage, addScript, create: create_package_json } = require('./package-json');

const _addLocalNeo4j = async () => {
    const _path = `${path.join(__dirname, '..')}/aws/local/neo4j.yml`;
    const directories = [
        'aws',
        'aws/local'
    ]
    await file.doesLocalDirectoriesExist(directories);
    await file.write_yaml(_path, neo4j_local_template);
    return true;
}

const _addServerlessVariables = async () => {
    const data = {
        key: 'neo4j_config',
        value: {
            local: {
                host: 'bolt://localhost:7687',
                user: 'neo4j',
                password: 'password',
                encrypted: 'ENCRYPTION_OFF'
            }
        }
    }

    return serverless_helper.addCustom(data);
}

const _addEnvironmentVariables = async () => {
    const directories = [
        'aws',
        'aws/envs'
    ]
    await file.doesLocalDirectoriesExist(directories);
    const _path = `${path.join(__dirname, '..')}/aws/envs/local.yml`;
    const local_env_exists = await file.path_exists(_path);
    console.log('logging if exists?', local_env_exists)
    if(!local_env_exists) {
        // const 
        await file.write_yaml(_path, local_env_template);
    }

    const local_env = await file.read_yaml(_path);
    // console.log('logging local_env_template', local_env_template);
    local_env.environment.NEO4J_HOST = '${self:custom.neo4j_config.${self:provider.stage}.host}';
    local_env.environment.NEO4J_USER = '${self:custom.neo4j_config.${self:provider.stage}.user}';
    local_env.environment.NEO4J_PASSWORD = '${self:custom.neo4j_config.${self:provider.stage}.password}';
    local_env.environment.NEO4J_ENCRYPTED = '${self:custom.neo4j_config.${self:provider.stage}.encrypted}';

    return file.write_yaml(_path, local_env);
}

const _createVersionerFunction = async () => {
    const directories = [
        'application',
        'application/v1',
        'application/v1/controller',
        'application/v1/controller/console',
    ]
    await file.doesLocalDirectoriesExist(directories);
    const formatted = formatter.format(versioner_template);
    return file.write_file(`${path.join(__dirname, '..')}/application/v1/controller/console/database_versioner.js`, formatted)
}

const _addNeo4jDatabaseVersioner = async () => {
    await file.create_directory(`${path.join(__dirname, '..')}/db_versions`);
    // add syngenta-database-versioner to package json
    // (consists of name, an optional version (Will use * if none provided.), and isDev (defaults to false))
    const packages = [
        {
            name: 'neo4j-driver',
            version: '^4.0.2',
        },
        {
            name: 'syngenta-database-versioner',
            version: '1.3.4',
        }
    ]
    await packagejson_helper.addPackage(packages);
    // now create db-versioner function
    return _createVersionerFunction();

}

const _verifyPackageJsonExists = async (project_name = 'syngenta-generated-project-name') => {
    return create_package_json(project_name);
}

const _addStarterScriptsToPackageJson = async () => {
    const scripts = [
        {
            name: 'start',
            value: "concurrently \"docker-compose -f aws/local/neo4j.yml up -d\" \"serverless offline start --stage local --aws_envs local --profile local --region us-east-2\""
        },
        {
            name: 'version',
            value: "serverless invoke local --function v1-console-database-versioner --stage local --aws_envs local --region us-east-2"
        }
    ]

    return addScript(scripts);
}

exports.init = async () => {
    await _verifyPackageJsonExists();
    await _addStarterScriptsToPackageJson();
    await _addNeo4jDatabaseVersioner();
    await _addLocalNeo4j();
    await _addEnvironmentVariables();
    await _addServerlessVariables();
    return true;
}