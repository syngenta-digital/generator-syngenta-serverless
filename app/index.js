'use strict';
const Generator = require('yeoman-generator');
// const yaml = require('js-yaml');
// const fs = require('fs');
const { default: menu } = require('./states/menu');
const { default: s3Handler, handler: s3ResponseHandler } = require('./states/s3');

const serverless = require('../helpers/serverless');
const file = require('../helpers/file');
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

const update_state = new_state => {
  
}

const function_hash_map = new Map([
  ['INIT', menu],
  ['S3', s3Handler],
]);

const answers_hash_map = new Map([
  ['S3', s3ResponseHandler]
]);

const validateServerlessFileExists = async args => {
  const _path = `${file.root()}serverless.yml`;
  const exists = await file.path_exists(_path);
  if(!exists) {
    await serverless.init(args.app, args.service);
  }

  return true;
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
    const answers = await menu(this);
    // switch(STATE) {
    //   {
    //     case 'INIT':
          
    //   }
    // }
    console.log('logging answers', answers);
    const services = answers.services.split(',');
    for(const service of services) {
      await validateServerlessFileExists(answers);
      this.state = service;
      const args = await function_hash_map.get(service.toUpperCase())(this);
      await answers_hash_map.get(service.toUpperCase())(args);
    }
    // .then(async (answers) => {
    //   logger.log('Starting Syngenta Serverless Generator...');
    //   // await serverless.init(args);
    //   console.log('logging answers', answers);
    //   logger.log('finished!');
    // });
  }
};