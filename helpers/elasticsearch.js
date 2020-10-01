const file = require('./file');
const serverless_helper = require('./serverless');
const { validResourceName } = require('./string');
const { custom_es, default: es_template } = require('../templates/aws/resources/elasticsearch');

const _environmentVariables = async (domain_name, index, type) => {
    const directories = [
        'aws',
        'aws/envs'
    ]
    await file.doesLocalDirectoriesExist(directories);
    const local_env_path = `${file.root(true)}aws/envs/local.yml`;
    const local_env_exists = await file.path_exists(local_env_path);
    if(!local_env_exists) {
        await file.write_yaml(`${file.root(true)}aws/envs/local.yml`, local_env_template);
    }
    const local_env = await file.read_yaml(local_env_path);
    local_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_INDEX`] = index;
    local_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_TYPE`] = type;
    local_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_').toUpperCase()}_DOMAIN`] = domain_name;
    
    await file.write_yaml(`${file.root(true)}aws/envs/local.yml`, local_env);

    const cloud_env_path = `${file.root(true)}aws/envs/cloud.yml`;
    const cloud_env_exists = await file.path_exists(cloud_env_path);

    if(!cloud_env_exists) {
        await file.write_yaml(`${file.root(true)}aws/envs/cloud.yml`, local_env_template);
    }

    const cloud_env = await file.read_yaml(cloud_env_path);
    cloud_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_INDEX`] = index;
    cloud_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_TYPE`] = type;
    cloud_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_').toUpperCase()}_DOMAIN`] = {
        'FN::GetAtt': [ `ElasticSearch${domain_name}`, 'DomainEndpoint' ]
    };
    return file.write_yaml(`${file.root(true)}aws/envs/cloud.yml`, cloud_env);
}
 
const _addServerlessVariables = async (domain_name, index, type, region) => {
    const _path = `${file.root(true)}serverless.yml`;
    const read_yaml = await file.read_yaml(_path);
    const { custom } = read_yaml;
    const { es } = custom;
    if(!es) {
        read_yaml.custom.es = {};
    }

    read_yaml.custom.es[domain_name] = custom_es(domain_name, index, type, region);

    const _es = {
        key: 'es',
        value: read_yaml.custom.es
    }
    
    return serverless_helper.addCustom(_es);
}

const _addDomain = async (domain_name, index, type) => {
    const _path = `${file.root(true)}aws/resources/elasticsearch.yml`;
    const base = {
        Resources: {},
        Outputs: {}
    }

    const does_exist = await file.path_exists(_path);
    if(!does_exist) {
        await file.write_yaml(_path, base);
    }

    const read_resource = await file.read_yaml(_path);
    read_resource.Resources[validResourceName(domain_name)] = es_template(domain_name);
    read_resource.Outputs[`Elasticsearch${validResourceName(domain_name)}Domain`] = {
        Value: {
            Ref: validResourceName(domain_name)
        }
    }

    read_resource.Outputs[`Elasticsearch${validResourceName(domain_name)}Arn`] = {
        Value: null
    }

    read_resource.Outputs[`Elasticsearch${validResourceName(domain_name)}Endpoint`] = {
        Value: null
    }
    return file.write_yaml(_path, read_resource);
}

exports.init = async args => {
    const { domain_name, index, type, region = 'us-east-2' } = args;
    await _environmentVariables(domain_name, index, type);
    await _addServerlessVariables(domain_name, index, type, region);
    await _addDomain(domain_name, index, type);
    return true;
}