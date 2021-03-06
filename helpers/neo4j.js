const path = require('path');
const file = require('./file');
const mock = require('../test/mock/data');
const formatter = require('esformatter');
const serverless_helper = require('../helpers/serverless');
const packagejson_helper = require('../helpers/package-json');
const neo4j_local_template = require('../templates/aws/local/neo4j');
const { default: local_env_template } = require('../templates/aws/envs/local');
const { default: versioner_template } = require('../templates/controller/console/neo4j_dbversioner');
const { default: neo4j } = require('../templates/aws/local/neo4j');
const { addPackage, addScript, create: create_package_json } = require('./package-json');

const _addLocalNeo4j = async () => {
    const _path = `${file.root(true)}aws/local/neo4j.yml`;
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
    const _path = `${file.root(true)}aws/envs/local.yml`;
    const local_env_exists = await file.path_exists(_path);
    if(!local_env_exists) {
        // const 
        await file.write_yaml(_path, local_env_template);
    }
    const local_env = await file.read_yaml(_path);
    local_env.environment.NEO4J_HOST = mock.properties.neo4j_host;
    local_env.environment.NEO4J_USER = mock.properties.neo4j_user;
    local_env.environment.NEO4J_PASSWORD = mock.properties.neo4j_password;
    local_env.environment.NEO4J_ENCRYPTED = mock.properties.neo4j_encrypted;

    return file.write_yaml(_path, local_env);
}

const _createVersionerFunction = async () => {
    // TODO need to add this function to the serverless file now...
    const directories = [
        'application',
        'application/v1',
        'application/v1/controller',
        'application/v1/controller/console',
    ]
    await file.doesLocalDirectoriesExist(directories);
    const formatted = formatter.format(versioner_template);
    return file.write_file(`${file.root(true)}application/v1/controller/console/database-versioner.js`, formatted)
}

const _addNeo4jDatabaseVersioner = async () => {
    if(!await file.path_exists(`${file.root(true)}db_versions`)) {
        await file.create_directory(`${file.root(true)}db_versions`);
    }
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
        // {
        //     name: 'version',
        //     value: "serverless invoke local --function v1-console-database-versioner --stage local --aws_envs local --region us-east-2"
        // }
    ]

    return addScript(scripts);
}

exports.init = async () => {
    await _verifyPackageJsonExists();
    await _addStarterScriptsToPackageJson();
    // await _addNeo4jDatabaseVersioner();
    await _addLocalNeo4j();
    await _addEnvironmentVariables();
    await _addServerlessVariables();
    return true;
}