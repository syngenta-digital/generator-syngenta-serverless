'use strict';
const Generator = require('yeoman-generator');
// const yaml = require('js-yaml');
// const fs = require('fs');
const { default: init_serverless } = require('./states/init');
const { default: menu } = require('./states/menu');
const { default: add_service } = require('./states/add-service');
const { handler: s3_response_handler } = require('./states/s3');
const { handler: sns_response_handler } = require('./states/sns');
const { handler: sqs_response_handler } = require('./states/sqs');

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
  'S3',
  'SNS',
  'SQS',
  'EXIT',
  'COMPLETE'
]

let STATE = 'INIT';

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
    await serverless.init(args.app, args.service);
  }

  return true;
}

const tempDirectoryConfig = async (app, root) => {
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
  ['EXIT', exit_response_handler],
  ['COMPLETE', complete_response_handler]
]);

const menu_hash_mapper = new Map([
  ['add-service', 'ADD-SERVICE'],
  ['complete', 'COMPLETE'],
  ['exit', 'EXIT'],
])

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.log('Initializing...');
  }

  async start() {
    this.log('Do something...');
    await tempDirectoryConfig('test', `${this.destinationPath()}/`);
    const init = await init_serverless(this);
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

    while(STATE !== "EXIT" && STATE !== "COMPLETE") {
      await loop();
    }

    if(STATE === "COMPLETE") {
      console.log('Serverless Generator complete!');
      await file.force_delete_directory(`${file.root()}syngenta-generator-temp`);
    } else {
      console.log('exiting and deleting resources.\n\n COMPLETE! \n\n');
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