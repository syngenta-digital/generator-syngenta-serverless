const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const mock_guid = 'ce3710ae-aef8-4997-a349-a71e331e4cbb';
const mock_date = '2020-08-12T01:15:36.062Z';
const mock_serverless_json = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '../..')}/templates/serverless/serverless.yml`, 'utf8'));
const mock_app = 'grower';
const mock_service = 'contracts';
const mock_version = 'v1';
const mock_apigateway_type = 'apigateway';
const mock_apigateway_name = 'handler';
const mock_apigateway_executor = 'route';
const mock_apigateway_memorySize = 256;
const mock_apigateway_timeout = 30;
const mock_console_type = 'console';
const mock_console_name = 'handler';
const mock_console_executor = 'run';
const mock_console_memorySize = 256;
const mock_console_timeout = 30;

exports.properties = {
    guid: mock_guid,
    date: mock_date,
    app: mock_app,
    service: mock_service,
    version: mock_version,
    apigateway_type: mock_apigateway_type,
    apigateway_name: mock_apigateway_name,
    apigateway_executor: mock_apigateway_executor,
    apigateway_memorySize: mock_apigateway_memorySize,
    apigateway_timeout: mock_apigateway_timeout,
    console_type: mock_console_type,
    console_name: mock_console_name,
    console_executor: mock_console_executor,
    console_memorySize: mock_console_memorySize,
    console_timeout: mock_console_timeout,
    serverless_json: mock_serverless_json
}
