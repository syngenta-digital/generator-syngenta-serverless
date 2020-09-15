const fs = require('fs');
const yaml = require('js-yaml');
const formatter = require('esformatter');
const logger = require('../helpers/logger');

exports.create_directory = async (path) => {
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
}

exports.read_yaml = async (path) => {
    return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
}

exports.write_yaml = async (target_path, json) => {
    return fs.writeFile(target_path, yaml.safeDump(json), (err) => {
        if (err) {
            console.log(err);
        }
        
        Promise.resolve(true);
    });
}

exports.delete_file = async (path) => {
    try {
        return fs.unlinkSync(path)
        //file removed
      } catch(err) {
        logger.error(err)
      }
}