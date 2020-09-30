const sqs = require('../../helpers/sqs');

const _init = async _this => {
    return _this.prompt([
        {
            type    : 'input',
            name    : 'queue_name',
            message : `What would you like queue name to be?`
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

const _acceptableDLQ = (value) => {
    switch(value) {
        case 'yes':
        case 't':
        case 'y':
        case 'true':
        case 'yeah':
        case 'ye':
        case 'ya':
        case 'yah':
        case 'yeh':
            return true;
        default:
            return false;
    }
}

exports.handler = async _this => {
    const init_response = await _init(_this);
    const { queue_name, includeDLQ } = init_response;
    const _includeDLQ = _acceptableDLQ();
    return _addQueue(queue_name, _includeDLQ);
}