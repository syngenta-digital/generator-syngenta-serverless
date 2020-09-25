const path = require('path');
const file = require('./file');
const mock = require('../test/mock/data');
const serverless_helper = require('../helpers/serverless');
const rds_postgres_template = require('../templates/aws/resources/postgres/rds-postgres');
const security_group_rules_template = require('../templates/aws/resources/mysql/security-group-rules');
const security_group_template = require('../templates/aws/resources/mysql/security-group');
const vpc_rds_template = require('../templates/aws/resources/mysql/vpc-rds');
const formatter = require('esformatter');
const { default: local_env_template } = require('../templates/aws/envs/local');
const { default: local_postgres_template } = require('../templates/aws/local/postgres');

const _localPostgres = async () => {
    const _path = `${path.join(__dirname, '..')}/aws/local/postgres.yml`;
    const directories = [
        'aws',
        'aws/local'
    ]
    await file.doesLocalDirectoriesExist(directories);
    await file.write_yaml(_path, local_postgres_template);
}

const _addPostgresResources = async (args) => {
    const resources = [
        'rds-postgres'
    ]

    return serverless_helper.addResources(resources, args);
}

const _iamRoles = async () => {
    return serverless_helper.addIamRole('aws/iamroles/ssm.yml', 'ssm');
}

exports.init = async args => {
    await _addPostgresResources(args);
    await _iamRoles();
    await _localPostgres(args.db_name);
    return true;
}
