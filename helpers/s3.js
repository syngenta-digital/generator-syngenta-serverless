const file = require('./file');
const { addIamRole, addCustom } = require('../helpers/serverless');
const { bucket, public_policy, website } = require('../templates/aws/resources/s3');
const { default: local_env_template } = require('../templates/aws/envs/local');

const _environmentVariables = async bucket_name => {
    const directories = [
        'aws',
        'aws/envs'
    ]
    await file.doesLocalDirectoriesExist(directories);
    const local_env_path = `${file.root()}aws/envs/local.yml`;
    const local_env_exists = await file.path_exists(local_env_path);
    if(!local_env_exists) {
        await file.write_yaml(local_env_path, local_env_template);
    }
    const local_env = await file.read_yaml(local_env_path);
    local_env.environment[`${bucket_name.replace(/-/g, '_').toUpperCase()}_S3_BUCKET`] = `\${self:provider.stackTags.name}-${bucket_name}-storage`;
    
    await file.write_yaml(local_env_path, local_env);

    const cloud_env_path = `${file.root()}aws/envs/cloud.yml`;
    const cloud_env_exists = await file.path_exists(cloud_env_path);

    if(!cloud_env_exists) {
        await file.write_yaml(cloud_env_path, local_env_template);
    }

    const cloud_env = await file.read_yaml(cloud_env_path);
    cloud_env.environment[`${bucket_name.replace(/-/g, '_').toUpperCase()}_S3_BUCKET`] = `\${self:provider.stackTags.name}-${bucket_name}-storage`;
    return file.write_yaml(cloud_env_path, cloud_env);
}

const _addServerlessVariables = async () => {

    return true;
}

const _addIamRoles = async () => {
    return addIamRole('aws/iamroles/sqs.yml', 'sqs');
}

const _addBucket = async (bucket_name, isPublic, isWebsite) => {
    const _path = `${file.root()}aws/resources/s3.yml`;

    const path_exists = await file.path_exists(_path);
    let read_resource = {
        Resources: {}
    };

    if(path_exists) {
        read_resource = await file.read_yaml(_path);
    }
    
    const template = bucket(bucket_name);
    read_resource.Resources[`${bucket_name}Storage`] = template;
    if(isPublic) {
        const public_policy_template = public_policy(bucket_name);
        read_resource.Resources[`AttachmentsBucketAllowPublicReadPolicy${bucket_name}`] = public_policy_template;
    }
    return file.write_yaml(_path, read_resource);
}

exports.init = async args => {
    const { bucket_name, isPublic, isWebsite } = args;
    await _environmentVariables(bucket_name);
    await _addServerlessVariables();
    await _addIamRoles();
    await _addBucket(bucket_name, isPublic, isWebsite);
    return true;
}