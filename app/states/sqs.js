const sqs = require('../../helpers/sqs');
const { acceptableBoolean } = require('../helpers/boolean');

const _init = async _this => {
    return _this.prompt([
        {
            type    : 'input',
            name    : 'queue_name',
            message : `\n\n========================== CREATING SQS RESOURCE ==========================\n\nWhat would you like queue name to be?`
        },
        {
            type    : 'input',
            name    : 'includeDLQ',
            message : `Would you like to include a Dead Letter Queue (DLQ) (Any tickets unsuccessfully processed will end up in this queue)?`
        }
    ])
}

const _addQueue = async (queue_name, includeDLQ ) => {
    return sqs.init({
        queue_name,
        includeDLQ
    })
}

exports.handler = async _this => {
    const init_response = await _init(_this);
    const { queue_name, includeDLQ } = init_response;
    const _includeDLQ = acceptableBoolean(includeDLQ);
    return _addQueue(queue_name, _includeDLQ);
}