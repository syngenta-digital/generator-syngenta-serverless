'use strict';
const Generator = require('yeoman-generator');
// const yaml = require('js-yaml');
// const fs = require('fs');
const { default: menu } = require('./states/menu');
const { default: s3Handler, handler: s3ResponseHandler } = require('./states/s3');
const serverless = require('../helpers/serverless');
const file = require('../helpers/file');

const root_temp_directory = 'syngenta-generator-temp';
const STATE_ENUM = [
  'INIT',
  'APIGATEWAY',
  'RDS-MYSQL',
  'RDS-POSTGRES',
  'DYNAMODB',
  'S3',
  'SNS',
  'SQS',
  'COMPLETE'
]

let STATE = 'INIT';

const reset = () => {
  update_state('INIT');
}

const update_state = new_state => {
  if(STATE_ENUM.indexOf(new_state) > -1) STATE = new_state;
}

const function_hash_map = new Map([
  ['INIT', menu],
  ['S3', s3Handler],
]);

const answers_hash_map = new Map([
  ['S3', s3ResponseHandler]
]);

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

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.log('Initializing...');
    this.generator = {
      state: 'INIT'
    }
  }



  // get state() {
  //   return this.state;
  // }

  // set state(_state) {
  //   if(STATE_ENUM.indexOf(new_state) > -1) this.state = _state;
  // }

  async start() {
    this.log('Do something...');
    await tempDirectoryConfig('test', `${this.destinationPath()}/`);
    const answers = await menu(this);
    console.log('logging answers', answers);
    const services = answers.services.split(',');
    for(const service of services) {
      await validateServerlessFileExists(answers);
      this.state = service;
      const args = await function_hash_map.get(service.toUpperCase())(this);
      await answers_hash_map.get(service.toUpperCase())(args);
      update_state(service.toUpperCase());
    }


    // switch(STATE) {
    //   {
    //     case 'INIT':
          
    //   }
    // }

    // .then(async (answers) => {
    //   logger.log('Starting Syngenta Serverless Generator...');
    //   // await serverless.init(args);
    //   console.log('logging answers', answers);
    //   logger.log('finished!');
    // });
  }
};