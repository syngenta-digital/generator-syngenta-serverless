// this file will help with any serverless or associated file building.
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
// const logger = require('./logger');

const _initServerless = (args) => {
    return new Promise(async (resolve) => {
        let doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/templates/serverless.yml`, 'utf8'));
        doc.app = args.app;
        doc.service = args.service;
        // TODO: i think this will need to be changed if this is going to be a package
        return fs.writeFile('./serverless.yml', yaml.safeDump(doc), (err) => {
            if (err) {
                console.log(err);
            }
            
            resolve(doc);
        });
    })
}

exports.init = async (args) => {
    return _initServerless(args);
}

