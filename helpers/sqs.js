const file = require('./file');
const { addIamRole, addResources, addCustom } = require('../helpers/serverless');
const { default: local_env_template } = require('../templates/aws/envs/local');

const _addServerlessVariables = async () => {
    const policies = {
        key: 'arn',
        value: '${file(./aws/envs/${opt:aws_envs, \'local\'}.yml):arn}'
    }
    return addCustom(policies);
}

const _environmentVariables = async () => {
    const directories = [
        'aws',
        'aws/envs'
    ]
    await file.doesLocalDirectoriesExist(directories);
    const local_env_path = `${file.root(true)}aws/envs/local.yml`;
    const local_env_exists = await file.path_exists(local_env_path);
    if(!local_env_exists) {
        await file.write_yaml(local_env_path, local_env_template);
    }
    const local_env = await file.read_yaml(local_env_path);
    if(local_env.policies) {
        local_env.policies.sqs = '${cf:${self:provider.stage}-platform-model-revisions.ModelRevisionTopicName}';
    } else {
        local_env.policies = {
            sqs: '${cf:${self:provider.stage}-platform-model-revisions.ModelRevisionTopicName}'
        }
    }

    await file.write_yaml(local_env_path, local_env);

    const cloud_env_path = `${file.root(true)}aws/envs/cloud.yml`;
    const cloud_env_exists = await file.path_exists(cloud_env_path);

    if(!cloud_env_exists) {
        await file.write_yaml(cloud_env_path, local_env_template);
    }

    const cloud_env = await file.read_yaml(cloud_env_path);
    if(cloud_env.policies) {
        cloud_env.policies.sqs = '${cf:${self:provider.stage}-platform-model-revisions.ModelRevisionTopicName}';
    } else {
        cloud_env.policies = {
            sqs: '${cf:${self:provider.stage}-platform-model-revisions.ModelRevisionTopicName}'
        }
    }
    return file.write_yaml(cloud_env_path, cloud_env);
}

const _addIamRoles = async () => {
    return addIamRole('./aws/iamroles/sqs.yml', 'sqs');
}

const _addResource = async (args) => {
    const resources = ['sqs'];
    return addResources(resources, args);
}

exports.init = async args => {
    await _addIamRoles();
    await _environmentVariables();
    await _addServerlessVariables();
    await _addResource(args);
    return true;
}