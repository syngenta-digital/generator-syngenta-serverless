const path = require('path');
const file = require('./file');
const mock = require('../test/mock/data');
const serverless_helper = require('../helpers/serverless');
const rds_mysql_template = require('../templates/aws/resources/mysql/rds-mysql');
const security_group_rules_template = require('../templates/aws/resources/mysql/security-group-rules');
const security_group_template = require('../templates/aws/resources/mysql/security-group');
const vpc_rds_template = require('../templates/aws/resources/vpc');
const formatter = require('esformatter');
const { default: local_env_template } = require('../templates/aws/envs/local');
const { default: versioner_template } = require('../templates/controller/console/mysql_dbversioner');
const { default: db_connector_template } = require('../templates/controller/console/mysql_db_connector');
const { default: ssm_template } = require('../templates/controller/console/mysql_ssm_connector');
const { default: local_mysql_template } = require('../templates/aws/local/mysql');

const { addPackage, create: create_package_json } = require('./package-json');

const _localMysql = async (db_name = 'syngenta-generated-test-database') => {
    const _path = `${file.root()}aws/local/mysql.yml`;
    const directories = [
        'aws',
        'aws/local'
    ]
    await file.doesLocalDirectoriesExist(directories);
    await file.write_yaml(_path, local_mysql_template(db_name));
}

const _addServerlessVariables = async () => {
    const security_group_custom = {
        key: 'security_group',
        value: '${file(./aws/resources/security-group-rules.yml):groups}'
    }

    await serverless_helper.addCustom(security_group_custom);

    const db_instance_size_custom = {
        key: 'db_instance_size',
        value: {
            local: 'db.t2.small',
            dev: 'db.t2.small',
            qa: 'db.m4.large',
            uat: 'db.m4.large',
            prod: 'db.m4.large'
        }
    }

    await serverless_helper.addCustom(db_instance_size_custom);
}

const _environmentVariables = async (db_name) => {
    const directories = [
        'aws',
        'aws/envs'
    ]
    await file.doesLocalDirectoriesExist(directories);
    const local_env_path = `${file.root()}aws/envs/local.yml`;
    const local_env_exists = await file.path_exists(local_env_path);
    if(!local_env_exists) {
        // const 
        await file.write_yaml(local_env_path, local_env_template);
    }
    const local_env = await file.read_yaml(local_env_path);
    local_env.environment.DB_NAME = db_name;
    local_env.environment.DB_APP_USER = db_name;
    local_env.environment.DB_HOST = '127.0.0.1'
    local_env.environment.DB_MASTER_USER = 'root';
    local_env.environment.DB_MASTER_PASS = 'root_password';
    local_env.environment.DB_URI = `mysql://root:root_password@127.0.0.1:3306/${db_name}`
    
    await file.write_yaml(local_env_path, local_env);

    const cloud_env_path = `${file.root()}aws/envs/cloud.yml`;
    const cloud_env_exists = await file.path_exists(cloud_env_path);

    if(!cloud_env_exists) {
        // const 
        await file.write_yaml(cloud_env_path, local_env_template);
    }

    const cloud_env = await file.read_yaml(cloud_env_path);
    cloud_env.environment.DB_NAME = db_name;
    cloud_env.environment.DB_APP_USER = db_name;
    cloud_env.environment.DB_HOST = {
        ['Fn::GetAtt']: [
            `${db_name.replace(/-/g, '').trim()}DB`,
            'Endpoint.Address'
        ]
    };
    cloud_env.environment.DB_MASTER_USER = 'root';
    cloud_env.environment.DB_MASTER_PASS = 'root_password';
    return file.write_yaml(cloud_env_path, cloud_env);
}

const _createVersionerFunction = async () => {
    const directories = [
        'application',
        'application/v1',
        'application/v1/controller',
        'application/v1/controller/console',
    ]
    await file.doesLocalDirectoriesExist(directories);
    const formatted = formatter.format(versioner_template());
    await file.write_file(`${file.root()}application/v1/controller/console/database-versioner.js`, formatted);
    await _dbConnector();
    await _ssm();
    return serverless_helper.addFunction({
        version: 'v1',
        hash_type: 'console-database-versioner',
        executor: 'apply',
        memorySize: 512,
        timeout: 900
    })
}

//TODO: this is wrong handler: application/v1/controller/console/_router.apply
// also template has it .applyVersion and in serverless we say apply, fix dude.
const _addMysqlDatabaseVersioner = async () => {
    if(!await file.path_exists(`${file.root()}db_versions`)) {
        await file.create_directory(`${file.root()}db_versions`);
    }
    const packages = [
        {
            name: 'mysql',
            version: '^2.17.1',
        },
        {
            name: 'mysql-import',
            version: '^4.0.24',
        }
    ]

    await addPackage(packages);
    return _createVersionerFunction();
}

const _verifyPackageJsonExists = async (project_name = 'syngenta-generated-project-name') => {
    return create_package_json(project_name);
}

const _addMysqlResources = async (args) => {
    const resources = [
        'rds-mysql',
        'security-group-rules',
        'security-group',
        'vpc-rds'
    ]

    return serverless_helper.addResources(resources, args);
}

const _dbConnector = async () => {
    const directories = [
        'application',
        'application/v1',
        'application/v1/controller',
        'application/v1/controller/console',
        'application/v1/controller/console/config',
    ]
    await file.doesLocalDirectoriesExist(directories);
    const formatted = formatter.format(db_connector_template);
    await file.write_file(`${file.root()}application/v1/controller/console/config/dbConnector.js`, formatted);
    return file.copy_directory(`${file.root()}templates/controller/console/helpers`, `${file.root()}application/v1/controller/console/config`);
}

const _ssm = async () => {
    const directories = [
        'application',
        'application/v1',
        'application/v1/controller',
        'application/v1/controller/console',
        'application/v1/controller/console/config',
    ]
    await file.doesLocalDirectoriesExist(directories);
    const formatted = formatter.format(ssm_template);
    await file.write_file(`${file.root()}application/v1/controller/console/config/ssm.js`, formatted);
    return file.copy_directory(`${file.root()}templates/controller/console/helpers`, `${file.root()}application/v1/controller/console/config`);
}

const _iamRoles = async (api_name) => {
    return serverless_helper.addIamRole('./aws/iamroles/ssm.yml', 'ssm', api_name);
}

exports.init = async args => {
    await _verifyPackageJsonExists();
    // await _addMysqlDatabaseVersioner();
    await _addMysqlResources(args);
    await _environmentVariables(args.db_name);
    await _addServerlessVariables();
    await _iamRoles(args.api_name);
    await _localMysql(args.db_name);
    return true;
}

