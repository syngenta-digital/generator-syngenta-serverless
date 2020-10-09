'use strict';
const Generator = require('yeoman-generator');
// const yaml = require('js-yaml');
// const fs = require('fs');
const { supported_node_versions, supported_python_versions, supported_java_versions, map_runtime_object_to_runtime } = require('./helpers/runtimes');
const { default: init_serverless } = require('./states/init');
const { default: menu } = require('./states/menu');
const { default: add_service } = require('./states/add-service');
const { handler: s3_response_handler } = require('./states/s3');
const { handler: sns_response_handler } = require('./states/sns');
const { handler: sqs_response_handler } = require('./states/sqs');
const { handler: dynamodb_response_handler } = require('./states/dynamodb');
const { handler: apigateway_response_handler } = require('./states/apigateway');
const { handler: mysql_response_handler } = require('./states/rds-mysql');
const { handler: postgres_response_handler } = require('./states/rds-postgres');
const { handler: elasticsearch_response_handler } = require('./states/elasticsearch');
const { handler: neo4j_response_handler } = require('./states/neo4j');

const serverless = require('../helpers/serverless');
const file = require('../helpers/file');

const root_temp_directory = 'syngenta-generator-temp';
const STATE_ENUM = [
  'INIT',
  'ADD-SERVICE',
  'APIGATEWAY',
  'RDS-MYSQL',
  'RDS-POSTGRES',
  'DYNAMODB',
  'ELASTICSEARCH',
  'NEO4J',
  'S3',
  'SNS',
  'SQS',
  'EXIT',
  'COMPLETE'
]

let STATE = 'INIT';
let app = '';
let service = '';

const reset = () => {
  update_state('INIT');
}

const update_state = new_state => {
  if(STATE_ENUM.indexOf(new_state) > -1) {
    STATE = new_state.toUpperCase();
  }
}

const exit_response_handler = async () => {
  return {
    services: 'EXIT'
  };
}

const complete_response_handler = async () => {
  return {
    services: 'COMPLETE'
  };;
}

const validateServerlessFileExists = async args => {
  const _path = `${file.root(true)}serverless.yml`;
  const exists = await file.path_exists(_path);
  if(!exists) {
    await serverless.init(args.app, args.service, args.runtime_normalized);
  }

  return true;
}

const tempDirectoryConfig = async (root) => {
  const _path = `${file.root()}${root_temp_directory}`;
  const exists = await file.path_exists(_path);
  if(!exists) {
    await file.create_directory(_path);
  }

  const config_path = `${_path}/config.yml`;
  const config_exists = await file.path_exists(config_path);
  let config = null;
  if(!config_exists) {
      config = {};
  } else {
      config = await file.read_yaml(config_path);
  }

  config = {
    root
  }

  await file.write_yaml(`${file.root()}${root_temp_directory}/config.yml`, config);
}

const convert_menu_answer = {
  '1': 'add-service',
  '2': 'complete',
  '3': 'exit'
}

const function_hash_map = new Map([
  ['INIT', menu],
  ['ADD-SERVICE', add_service],
  ['EXIT', exit_response_handler],
  ['COMPLETE', complete_response_handler]
]);

const answers_hash_map = new Map([
  ['S3', s3_response_handler],
  ['SNS', sns_response_handler],
  ['SQS', sqs_response_handler],
  ['DYNAMODB', dynamodb_response_handler],
  ['APIGATEWAY', apigateway_response_handler],
  ['ELASTICSEARCH', elasticsearch_response_handler],
  ['MYSQL', mysql_response_handler],
  ['POSTGRES', postgres_response_handler],
  ['NEO4J', neo4j_response_handler],
  ['EXIT', exit_response_handler],
  ['COMPLETE', complete_response_handler]
]);

const menu_hash_mapper = new Map([
  ['add-service', 'ADD-SERVICE'],
  ['complete', 'COMPLETE'],
  ['exit', 'EXIT'],
])

const _analyze_runtime_from_response = (runtime, runtime_version) => {
  const result = {
    runtime: null,
    runtime_version: null
  }
  switch(runtime) {
    case 'node':
      result.runtime = 'node';
      if(!runtime_version || supported_node_versions.indexOf(runtime_version) === -1) {
        result.runtime_version = '12';
      }
      else {
        result.runtime_version = runtime_version;
      }
      break;
    case 'python':
      result.runtime = 'python';
      if(!runtime_version || supported_python_versions.indexOf(runtime_version) === -1) {
        result.runtime_version = '3.8';
      }
      else {
        result.runtime_version = runtime_version;
      }
      break;
    case 'java':
      result.runtime = 'java';
      if(!runtime_version || supported_java_versions.indexOf(runtime_version) === -1) {
        result.runtime_version = '11';
      }
      else {
        result.runtime_version = runtime_version;
      }
      break;
    default:
      result.runtime = 'node';
      result.runtime_version = '12';
      break;
  }

  return result;
}

const analyze_runtime_from_serverless = runtime => {
  const node = runtime.indexOf('node') > -1;
  const python = runtime.indexOf('python') > -1;
  const java = runtime.indexOf('java') > -1;

  const result = {
    runtime: null,
    runtime_version: null
  }

  if(node) {
    result.runtime = 'node';
    let match_version = runtime.split('nodejs')[1];
    if(match_version.indexOf('.') > -1) {
      match_version = match_version.split('.')[0];
      if(supported_node_versions.indexOf(match_version) > -1) result.runtime_version = match_version;
      else result.runtime_version = supported_node_versions[0];
    }
  } else if(python) {
    result.runtime = 'python';
    let match_version = runtime.split('python')[1];
    if(supported_python_versions.indexOf(match_version) > -1) result.runtime_version = match_version;
    else result.runtime_version = supported_python_versions[0];
  } else if(java) {
    result.runtime = 'java';
    let match_version = runtime.split('java')[1];
    if(supported_java_versions.indexOf(match_version) > -1) result.runtime_version = match_version;
    else result.runtime_version = supported_java_versions[0];
  } else {
    throw new Error('unsupported runtime detected')
  }

  return result;
}

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.log('Initializing...');
  }

  async start() {
    this.log('Starting generator...');
    const _serverless_path = `${this.destinationPath()}/serverless.yml`;
    let serverless_exists = await file.path_exists(_serverless_path);
    if(serverless_exists) {
      const read_serverless = await file.read_yaml(_serverless_path);
      if(!read_serverless.app && !read_serverless.service) serverless_exists = false;
    }

    await tempDirectoryConfig(`${this.destinationPath()}/`);

    const loop = async () => {
      const menu_answer = await menu(this);
      const new_state = menu_hash_mapper.get(convert_menu_answer[menu_answer.menu]);
      update_state(new_state.toUpperCase());

      const answers = await function_hash_map.get(new_state.toUpperCase())(this);
      const services = answers.services.split(',');
      for(const service of services) {
        await validateServerlessFileExists(init);
        this.state = service;
        // const args = await function_hash_map.get(service.toUpperCase())(this);
        await answers_hash_map.get(service.toUpperCase())(this);
        update_state(service.toUpperCase());
      }

      return true;
    }
    let init = null;

    if(!serverless_exists) {
      init = await init_serverless(this);
      const analyze_response = _analyze_runtime_from_response(init.runtime, init.runtime_version);
      init = {
        ...init,
        runtime: analyze_response.runtime,
        runtime_version: analyze_response.runtime_version
      }
    } else {
      const read_serverless = await file.read_yaml(_serverless_path);
      const { app, service, provider } = read_serverless;
      let _runtime = null;
      if(provider) {
        const { runtime } = provider;
        _runtime = analyze_runtime_from_serverless(runtime);
      }

      const { runtime, runtime_version } = _runtime;

      init = {
        app,
        service,
        runtime,
        runtime_version
      }
    }

    this._syngenta_app = init.app;
    this._syngenta_service = init.service;
    const runtime_normalized = map_runtime_object_to_runtime(init);
    this._syngenta_runtime_normalized = runtime_normalized;
    init.runtime_normalized = runtime_normalized;

    while(STATE !== "EXIT" && STATE !== "COMPLETE") {
      await loop();
    }

    if(STATE === "COMPLETE") {
      console.log('Serverless Generator complete!');
      await file.force_delete_directory(`${file.root()}syngenta-generator-temp`);
    } else {
      console.log('\n\n> exiting and deleting resources.\n\n> COMPLETE! \n\n');
      await file.delete_file(`${file.root(true)}serverless.yml`);
      await file.delete_file(`${file.root(true)}package.json`);
      await file.delete_file(`${file.root(true)}.nvmrc`);
      await file.delete_file(`${file.root(true)}.npmrc`);
      await file.force_delete_directory(`${file.root(true)}aws`);
      await file.force_delete_directory(`${file.root(true)}application`);
      await file.force_delete_directory(`${file.root(true)}db_versions`);
      await file.force_delete_directory(`${file.root(true)}.circleci`);
      await file.force_delete_directory(`${file.root(true)}.github`);
      await file.force_delete_directory(`${file.root()}syngenta-generator-temp`);
    }
  }
};