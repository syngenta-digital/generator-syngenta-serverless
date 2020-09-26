// this file will help with any serverless or associated file building.
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const file = require('./file');
const formatter = require('esformatter');
const packagejson_helper  = require('../helpers/package-json');
const {default: router_template}  = require('../templates/controller/apigateway/router');
const {default: apigateway_template}  = require('../templates/aws/resources/apigateway');
const {default: dynamodb_table_template}  = require('../templates/aws/resources/dynamodb/table');
const {default: dynamodb_database_template}  = require('../templates/aws/resources/dynamodb/database');
const {default: rds_postgres_template}  = require('../templates/aws/resources/postgres/rds-postgres');
const {default: rds_mysql_template}  = require('../templates/aws/resources/mysql/rds-mysql');
const {default: rds_dbinstance_template}  = require('../templates/aws/resources/rds-dbinstance');
const {default: security_group_template}  = require('../templates/aws/resources/mysql/security-group');
const {default: security_group_rules_template}  = require('../templates/aws/resources/mysql/security-group-rules');
const {default: vpc_rds_template}  = require('../templates/aws/resources/vpc');

const { ddbTemplate, s3Template, snsTemplate, sqsTemplate, ssmTemplate } = require('../templates/aws/iamRoles');
const SERVERLESS_LOCATION = `${path.join(__dirname, '../serverless.yml')}`;
const IAM_ROLES_LOCATION = `${path.join(__dirname, '../aws/iamroles')}`;
const RESOURCES_LOCATION = `${path.join(__dirname, '../aws/resources')}`;

const _initServerless = (app, service) => {
    return new Promise(async (resolve) => {
        // TODO: this path stuff is way too confusing need to somehow reference parent dir.
        const doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/templates/serverless/serverless.yml`, 'utf8'));
        doc.app = app;
        doc.service = service;
        await _createRouterFunction();
        // TODO: i think this will need to be changed if this is going to be a package
        resolve(file.write_yaml(SERVERLESS_LOCATION, doc));
    })
}

const _apigatewayHandler = (args) => {
    const { version, type, name, executor, memorySize = 256, timeout = 30 } = args;

    const doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/templates/serverless/serverless.yml`, 'utf8'));
    const function_name = `${version}-${type}-${name}`;
    const apigateway_function = {
        name: `\${self:provider.stackTags.name}-${function_name}`,
        description: 'API Router handler',
        handler: `application/${version}/controller/${type}/_router.${executor}`,
        memorySize,
        timeout
    }

    if(!doc.functions) {
        doc.functions = {};
    }

    doc.functions['v1-apigateway-handler'] = apigateway_function;
    return {
        new_function: apigateway_function,
        name: function_name
    };
}

const _databaseVersioner = (args) => {
    const { version, executor, memorySize = 256, timeout = 900 } = args;
    const doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/templates/serverless/serverless.yml`, 'utf8'));
    const function_name = `${version}-database-versioner`;
    const database_versioner_function = {
        name: `\${self:provider.stackTags.name}-${function_name}`,
        description: 'Applies versions to DB',
        handler: `application/${version}/controller/console/database-versioner.${executor}`,
        memorySize,
        timeout
    }

    if(!doc.functions) {
        doc.functions = {};
    }

    doc.functions['v1-database-versioner'] = database_versioner_function;
    return {
        new_function: database_versioner_function,
        name: function_name
    };
}

const _sqsListener = (args) => {
    const { version, name, executor, queue, memorySize = 256, timeout = 15 } = args;
    const doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/templates/serverless/serverless.yml`, 'utf8'));
    const function_name = `${version}-${name}`;
    const sqs_listener_function = {
        name: `\${self:provider.stackTags.name}-${function_name}`,
        description: `Generic SQS Listener function for ${name}`,
        handler: `application/${version}/sqs/${name}.${executor}`,
        memorySize,
        timeout,
        events: [
            {
                sqs: {
                    arn: {
                        'FN::GetAtt': `[ ${queue}, 'Arn' ]`
                    }
                }
            }
        ]
    }

    if(!doc.functions) {
        doc.functions = {};
    }

    doc.functions[`${version}-${name}`] = sqs_listener_function;
    return {
        new_function: sqs_listener_function,
        name: function_name
    };
}

const _createRouterFunction = async () => {
    const directories = [
        'application',
        'application/v1',
        'application/v1/controller',
        'application/v1/controller/apigateway',
    ]
    await file.doesLocalDirectoriesExist(directories);
    const formatted = formatter.format(router_template);
    const package = {
        name: 'syngenta-lambda-client'
    };
    await packagejson_helper.addPackage(package);
    return file.write_file(`${path.join(__dirname, '..')}/application/v1/controller/apigateway/_router.js`, formatted)
}


const functionHashMapper = new Map([
    ['apigateway-handler', _apigatewayHandler],
    ['console-database-versioner', _databaseVersioner],
    // v1-sqs-listener need to figure out how to make this work...
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

const _addFunction = async (args) => {
    // TODO: this path stuff is way too confusing need to somehow reference parent dir.
    const { hash_type } = args;
    const doc = await file.read_yaml(`${path.join(__dirname, '..')}/serverless.yml`);
    const new_function = functionHashMapper.get(hash_type)(args);
    if(!doc.functions) {
        doc.functions = {};
    }
    doc.functions[new_function.name] = new_function.new_function;
    await file.write_yaml(SERVERLESS_LOCATION, doc);
    return new_function;
}

const dynamodb_handler = async (args) => {
    const _resource_path = `${path.join(__dirname, '..')}/aws/resources/dynamodb.yml`;
    const does_resource_exist = await file.path_exists(_resource_path);
    let read_resource = null;
    if(!does_resource_exist) {
        read_resource = dynamodb_database_template();
    } else {
        read_resource = await file.read_yaml(_resource_path);
    }
    read_resource.Resources[args.db_name] = dynamodb_table_template(args.db_name);
    return read_resource;
}

const _addVpcPort = async (args, engine) => {
    let port = null;

    const _resource_path = `${path.join(__dirname, '..')}/aws/resources/security-group-rules.yml`;
    const does_resource_exist = await file.path_exists(_resource_path);

    if(!does_resource_exist) {
        await file.write_yaml(_resource_path, await security_group_rules_template(args));
    }

    const read_resource = await file.read_yaml(_resource_path);

    switch(engine) {
        case 'mysql':
            port = 3306;
            break;
        case 'postgres':
            port = 5432;
            break;
        default:
            throw new Error('Unsupported DB engine.');
    }

    const envs = [
        'dev',
        'qa',
        'prod'
    ]

    for(const env of envs) {
        const new_port = [
            {
                SourceSecurityGroupId: {
                Ref: "LambdaSecurityGroup"
                },
                IpProtocol: "tcp",
                FromPort: port,
                ToPort: port
            },
            {
                IpProtocol: "tcp",
                CidrIp: "0.0.0.0/0",
                FromPort: port,
                ToPort: port
            }
        ]
        if(!read_resource.groups[env].rds) {
            read_resource.groups[env].rds = {};
            read_resource.groups[env].rds.inbound = new_port;
        } else {
            const does_this_port_exist = read_resource.groups[env].rds.inbound.filter(x => x.FromPort === port).shift();
            if(!does_this_port_exist) {
                read_resource.groups[env].rds.inbound.push(new_port[0]);
                read_resource.groups[env].rds.inbound.push(new_port[1]);
            }
        }
    }

    return file.write_yaml(_resource_path, read_resource);
}

const rds_mysql_handler = async (args) => {
    const _resource_path = `${path.join(__dirname, '..')}/aws/resources/rds-mysql.yml`;
    const does_resource_exist = await file.path_exists(_resource_path);
    let read_resource = null;
    if(!does_resource_exist) {
        read_resource = rds_mysql_template(args);
    } else {
        read_resource = await file.read_yaml(_resource_path);
    }
    read_resource.Resources[args.db_name] = rds_dbinstance_template(args);
    // add correct vpc port
    await _addVpcPort(args, 'mysql');
    return read_resource;
}

const rds_postgres_handler = async (args) => {
    const _resource_path = `${path.join(__dirname, '..')}/aws/resources/rds-postgres.yml`;
    const does_resource_exist = await file.path_exists(_resource_path);
    let read_resource = null;
    if(!does_resource_exist) {
        read_resource = rds_postgres_template(args);
    } else {
        read_resource = await file.read_yaml(_resource_path);
    }
    read_resource.Resources[args.db_name] = rds_dbinstance_template(args);
    // add correct vpc port 
    await _addVpcPort(args, 'postgres');
    return read_resource;
}

const security_group_rules_handler = async () => {
    const _resource_path = `${path.join(__dirname, '..')}/aws/resources/security-group-rules.yml`;
    const does_resource_exist = await file.path_exists(_resource_path);
    let read_resource = null;
    if(!does_resource_exist) {
        read_resource = security_group_rules_template();
    } else {
        read_resource = await file.read_yaml(_resource_path);
    }

    return read_resource;
}

const _createResource = async (args) => {
    let fn = null;
    switch(args.resource) {
        case 'apigateway':
            fn = apigateway_template;
            break;
        case 'dynamodb':
            fn = dynamodb_handler;
            break;
        case 'rds-mysql':
            fn = rds_mysql_handler;
            break;
        case 'rds-postgres':
            fn = rds_postgres_handler;
            break;
        case 'security-group-rules':
            fn = security_group_rules_handler;
            break;
        case 'security-group':
            fn = security_group_template;
            break;
        case 'vpc-rds':
            fn = vpc_rds_template;
            break;
        default:
            throw new Error('invalid resource');
    }

    if(!fn) return null;

    return file.write_yaml(`${RESOURCES_LOCATION}/${args.resource}.yml`, await fn(args));
}

const _addResource = async (resource, args) => {
    await _resourcesDirectoriesExist();
    // TODO: this path stuff is way too confusing need to somehow reference parent dir.
    const doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/serverless.yml`, 'utf8'));
    if(!doc.resources) {
        doc.resources = [];
    }

    const black_list_resources_from_serverless_file = [
        'security-group-rules'
    ]
    
    if(!black_list_resources_from_serverless_file.includes(resource)) doc.resources.push(`\${file(aws/resources/${resource}.yml}`);
    await _createResource({ resource, ...args });
    return file.write_yaml(SERVERLESS_LOCATION, doc);
}

const available_services = [
    'dynamodb',
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

const _addPlugin = async (plugin) => {
    // TODO: this path stuff is way too confusing need to somehow reference parent dir.
    const _path = `${path.join(__dirname, '..')}/serverless.yml`;
    let doc = yaml.safeLoad(fs.readFileSync(_path, 'utf8'));
    const { plugins } = doc;
    if (!plugins) {
        doc.plugins = [];
    }

    doc.plugins.push(plugin);
    return file.write_yaml(_path, doc);
}

const _addIamRole = async (_path, add_to_aws_directory, service, api_name, bucket_name) => {
    // TODO: this path stuff is way too confusing need to somehow reference parent dir.
    await _iamRoleDirectoriesExist();
    let doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/serverless.yml`, 'utf8'));
    const { provider } = doc;
    const { iamRoleStatements } = provider;
    const iamrole = `\${file(${_path})}`;
    if (!iamRoleStatements) {
        doc.provider.iamRoleStatements = [];
    }
    if(doc.provider.iamRoleStatements.indexOf(iamrole) === -1 && service !== 'apigateway') {
        doc.provider.iamRoleStatements.push(iamrole);
        await file.write_yaml(SERVERLESS_LOCATION, doc);
        if (add_to_aws_directory) {
            switch (service) {
                case 'dynamodb':
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
    }
    return iamrole;
}

const _isPlainObject = (input) => {
    return input && !Array.isArray(input) && typeof input === 'object';
}
/**
 * @description initiates the serverless file, and will create a barebones one.
 * @param {app} app the app name
 * @param {service} service the service name
 */
exports.init = async (app, service) => {
    return _initServerless(app, service);
}
/**
 * 
 * @param {args} args args should contain everything needed to create a function in the serverless file. (version, hash_type, type, name, executor, memorySize, timeout)
 */
exports.addFunction = async (args) => {
    // const { version, hash_type, type, name, executor, memorySize, timeout } = args;
    return _addFunction(args);
}
/**
 * 
 * @param {path} path this is the path that will be added to the serverless file. (required) 
 * @param {service} service this is the service you are adding, it will create the other files needed for said service (required)
 * @param {api_name} api_name this is the api_name, if it applies. (Optional)
 * @param {bucket_name} bucket_name this is the bucket_name, if it applies. (Optional)
 */
exports.addIamRole = async (path, service, api_name, bucket_name) => {
    let add_to_aws_directory = false;
    if (available_services.indexOf(service) > -1) add_to_aws_directory = true;
    return _addIamRole(path, add_to_aws_directory, service, api_name, bucket_name);
}
/**
 * 
 * @param {data} data data is a key/value object that simply contains a key and a value to add to the custom serverless variables.
 */
exports.addCustom = async (data) => {
    const doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/serverless.yml`, 'utf8'));
    doc.custom[data.key] = data.value;
    await file.write_yaml(SERVERLESS_LOCATION, doc);
}
/**
 * 
 * @param {resources} resources  resources can be a singular script or an array of resources (just resource path string or array of resource path strings)
 */
exports.addResources = async (resources, args) => {
    let _resources = [];

    if(_isPlainObject(resources)) {
        _resources.push(resources);
    } else if (!(resources.constructor === Array)) {
        throw new Error("invalid resources type sent.")
    } else _resources = resources;

    for(const resource of _resources) {
        await _addResource(resource, args);
    }

    return true;
}
/**
 * 
 * @param {plugin} plugin plugin is just a string of the plugin you wish to add, or an array of plugin strings.
 */
exports.addPlugin = async (plugins) => {
    let _plugins = [];

    if (plugins.constructor === Array) {
        _plugins = plugins;
    } else _plugins.push(plugins);

    for(const plugin of _plugins) {
        await _addPlugin(plugin);
    }

    return true;
}
