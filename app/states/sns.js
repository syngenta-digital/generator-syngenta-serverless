const sns = require('../../helpers/sns');

const _topic_handler = async _this => {
    return _this.prompt([
        {
            type    : 'input',
            name    : 'topic_name',
            message : `What would you like topic name to be?`
        },
        {
            type    : 'input',
            name    : 'dedup',
            message : `Would you like Content-Based Deduplication?`
        }
    ])
}

const _subscription_handler = async _this => {
    // look at our current sqs queues and create a list of acceptable queues for user to pick?
    return _this.prompt([
        {
            type    : 'input',
            name    : 'sub_topic_name',
            message : `What would you like topic name to be?`
        },
        {
            type    : 'input',
            name    : 'sub_queue_name',
            message : `Whats the SQS queue name you are going to use for your SNS subscription trigger?`
        }
    ])
}

const _init = async _this => {
    return _this.prompt([
        {
            type    : 'input',
            name    : 'topic_or_sub',
            message : `Subscription or Topic?`
        }
    ])
}

const _addTopic = async (args) => {
    const { topic_name, dedup } = args;
    return sns.addTopic({
        topic_name,
        dedup
    })
}

const _addSubscription = async (args) => {
    const { topic_name, queue_name } = args;
    return sns.addSubscription({
        topic_name,
        queue_name
    })
}

exports.handler = async _this => {
    const init_response = await _init(_this);
    if(init_response.topic_or_sub.toLowerCase() === "subscription") {
        const topic_response = await _subscription_handler(_this);
        console.log('logging topic_response', topic_response);
        return _addTopic(topic_response);
    } else if (init_response.topic_or_sub.toLowerCase() === "topic") {
        const subscription_response = await _topic_handler(_this);
        console.log('logging subscription_response', subscription_response);
        return _addSubscription(subscription_response);
    }
}