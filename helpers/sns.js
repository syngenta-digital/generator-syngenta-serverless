const path = require('path');
const file = require('./file');
const { addIamRole } = require('../helpers/serverless');
const { topic: sns_topic_template, subscription: sns_subscription_template } = require('../templates/aws/resources/sns');

const _addServerlessVariables = async () => {
    // ${self:custom.accounts.${self:provider.stage}}
    // provide fake base ones
    return true;
}

const _addIamRoles = async () => {
    return addIamRole('aws/iamroles/sns.yml', 'sns');
}

const _addTopic = async (topic_name, dedup = false) => {
    const _path = `${path.join(__dirname, '..')}/aws/resources/sns.yml`;

    const path_exists = await file.path_exists(_path);
    let read_resource = {
        Resources: {}
    };

    if(path_exists) {
        read_resource = await file.read_yaml(_path);
    }
    
    const template = sns_topic_template(topic_name, dedup);
    read_resource.Resources[`${topic_name}Topic`] = template;
    return file.write_yaml(_path, read_resource);
}

const _addSubscription = async (topic_name, queue_name) => {
    const _path = `${path.join(__dirname, '..')}/aws/resources/sns.yml`;
    const path_exists = await file.path_exists(_path);
    let read_resource = {
        Resources: {}
    };
    if(path_exists) {
        read_resource = await file.read_yaml(_path);
    }

    const template = sns_subscription_template(topic_name, queue_name);
    read_resource.Resources[`${topic_name}Subscription`] = template;
    return file.write_yaml(_path, read_resource);
}

exports.init = async args => {
    const { topic_name, queue_name, dedup } = args;
    await _addIamRoles();
    await _addTopic(topic_name, dedup);
    await _addSubscription(topic_name, queue_name);
    return true;
}