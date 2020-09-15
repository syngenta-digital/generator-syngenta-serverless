'use strict';
const Generator = require('yeoman-generator');
// const yaml = require('js-yaml');
// const fs = require('fs');
const serverless = require('../helpers/serverless');
const logger = require('../helpers/logger');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.log('Initializing...');
  }
  async start() {
    this.log('Do something...');
    // this.prompt([
    //   {
    //     type    : 'input',
    //     name    : 'name',
    //     message : 'Enter a name for the new component (i.e.: myNewComponent): '
    //   }
    // ]).then(async (answers) => {
    logger.log('Starting Syngenta Serverless Generator...')
    await serverless.init(args);
    logger.log('finished!')
    // });
  }
};