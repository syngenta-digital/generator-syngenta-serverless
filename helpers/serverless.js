// this file will help with any serverless or associated file building.
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const file = require('./file');

const { ddbTemplate, s3Template, snsTemplate, sqsTemplate, ssmTemplate } = require('../templates/aws/iamRoles');
const SERVERLESS_LOCATION = `${path.join(__dirname, '../serverless.yml')}`;
const IAM_ROLES_LOCATION = `${path.join(__dirname, '../aws/iamroles')}`;

const _initServerless = (app, service) => {
    return new Promise(async (resolve) => {
        // TODO: this path stuff is way too confusing need to somehow reference parent dir.
        let doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/templates/serverless/serverless.yml`, 'utf8'));
        doc.app = app;
        doc.service = service;
        // TODO: i think this will need to be changed if this is going to be a package
        resolve(file.write_yaml(SERVERLESS_LOCATION, doc));
    })
}

const _apigatewayHandler = (doc, version, type, name, executor = 'run', memorySize = 256, timeout = 30) => {
    const apigateway_function = {
        name: `\${self:provider.stackTags.name}-${version}-${type}-${name}`,
        description: 'Create default templates',
        handler: `application/${version}/controller/${type}/_router.${executor}`,
        memorySize,
        timeout
    }

    doc.functions['v1-apigateway-handler'] = apigateway_function;
    return apigateway_function;
}

const functionHashMapper = new Map([
    ['v1-apigateway-handler', _apigatewayHandler],
]);

const _ddbIamRoleHandler = async () => {
    return file.write_yaml(`${IAM_ROLES_LOCATION}/dynamodb.yml`, ddbTemplate());
}

const _s3IamRoleHandler = async (bucket_name) => {
    return file.write_yaml(`${IAM_ROLES_LOCATION}/s3.yml`, s3Template(bucket_name));
}

const _snsIamRoleHandler = async () => {
    return file.write_yaml(`${IAM_ROLES_LOCATION}/sns.yml`, snsTemplate());
}

const _sqsIamRoleHandler = async () => {
    return file.write_yaml(`${IAM_ROLES_LOCATION}/sqs.yml`, sqsTemplate());
}

const _ssmIamRoleHandler = async (api_name) => {
    return file.write_yaml(`${IAM_ROLES_LOCATION}/ssm.yml`, ssmTemplate(api_name));
}

const _addFunction = async (hash_type, version, type, name, executor = 'run', memorySize = 256, timeout = 30) => {
    // TODO: this path stuff is way too confusing need to somehow reference parent dir.
    await _resourcesDirectoriesExist();
    const doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/serverless.yml`, 'utf8'));
    const result = functionHashMapper.get(hash_type)(doc, version, type, name, executor, memorySize, timeout);
    await file.write_yaml(SERVERLESS_LOCATION, doc);
    return result;
}

const available_services = [
    'ddb',
    's3',
    'sns',
    'sqs',
    'ssm'
];

const _resourcesDirectoriesExist = async () => {
    const directories = [
        'aws',
        'aws/resources'
    ]
    for (const dir of directories) {
        const does_exist = await file.path_exists(dir)
        if (!does_exist) await file.create_directory(`${path.join(__dirname, '..')}/${dir}`);
    }

    return true;
}

const _iamRoleDirectoriesExist = async () => {
    const directories = [
        'aws',
        'aws/iamroles'
    ]
    for (const dir of directories) {
        const does_exist = await file.path_exists(dir)
        if (!does_exist) await file.create_directory(`${path.join(__dirname, '..')}/${dir}`);
    }

    return true;
}

const _addIamRole = async (_path, add_to_aws_directory, service, api_name, bucket_name) => {
    // TODO: this path stuff is way too confusing need to somehow reference parent dir.
    await _iamRoleDirectoriesExist();
    let doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/serverless.yml`, 'utf8'));
    const { provider } = doc;
    const { iamRoleStatements } = provider;
    const iamrole = `\${file(${_path})}`;
    if (iamRoleStatements.length === 1 && iamRoleStatements[0] === 'override_me') {
        doc.provider.iamRoleStatements = [];
    }
    doc.provider.iamRoleStatements.push(iamrole);
    await file.write_yaml(SERVERLESS_LOCATION, doc);
    if (add_to_aws_directory) {
        switch (service) {
            case 'ddb':
                await _ddbIamRoleHandler();
                break;
            case 's3':
                await _s3IamRoleHandler(bucket_name);
                break;
            case 'sns':
                await _snsIamRoleHandler();
                break;
            case 'sqs':
                await _sqsIamRoleHandler();
                break;
            case 'ssm':
                await _ssmIamRoleHandler(api_name);
                break;
        }
    }
    return iamrole;
}

exports.init = async (app, service) => {
    return _initServerless(app, service);
}

exports.addFunction = async (args) => {
    const { version, hash_type, type, name, executor, memorySize, timeout } = args;
    return _addFunction(hash_type, version, type, name, executor, memorySize, timeout);
}

exports.addIamRole = async (path, service, api_name, bucket_name) => {
    let add_to_aws_directory = false;
    if (available_services.indexOf(service) > -1) add_to_aws_directory = true;
    return _addIamRole(path, add_to_aws_directory, service, api_name, bucket_name);
}

exports.addCustom = async (data) => {
    const doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/serverless.yml`, 'utf8'));
    doc.custom[data.key] = data.value;
    await file.write_yaml(SERVERLESS_LOCATION, doc);
}
