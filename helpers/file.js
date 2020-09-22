const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const rimraf = require("rimraf");
const logger = require('../helpers/logger');

const _path_exists = (path) => {
    return new Promise(resolve => {
        fs.access(path, (err) => {
            if (!err) {
                resolve(true);
                return;
            }
            resolve(false);
        });
    })
}

const _create_directory = async (path) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }

    return true;
}

exports.doesLocalDirectoriesExist = async (directories) => {
    for (const dir of directories) {
        const does_exist = await _path_exists(dir);
        console.log('logging dir', dir, 'logging if exists', does_exist)
        if (!does_exist) await _create_directory(`${path.join(__dirname, '..')}/${dir}`);
    }

    return true;
}

exports.create_directory = async (path) => {
    return _create_directory(path);
}

exports.delete_directory = async (path) => {
    if (fs.existsSync(path)) {
        fs.rmdir(path, (err) => {
            if (err) throw new Error(err);
            Promise.resolve(true);
        });
    }
}

exports.force_delete_directory = path => {
    return new Promise((resolve) => {
        try {
            rimraf(path, function () { resolve(); });
        } catch (e) {
            logger.error(e, null, false);
            resolve();
        }

    })
}

exports.read_file = (path, do_not_pase_json) => {
    return new Promise((resolve) => {
        fs.readFile(path, null, (err, data) => {
            if (err) {
                logger.warn(err);
                resolve(null);
                return;
            }
            if(do_not_pase_json) resolve(data);
            else resolve(JSON.parse(data));
        });
    })
}

exports.read_yaml = async (path) => {
    const exists = await this.read_file(path, true);
    if(!exists) return null;
    else return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
}

exports.write_yaml = async (target_path, json) => {
    return fs.writeFile(target_path, yaml.safeDump(json), (err) => {
        if (err) {
            logger.warn(err);
            Promise.resolve(false);
        }

        Promise.resolve(true);
    });
}

exports.write_file = async (path, data) => {
    return fs.writeFile(path, data, (err) => {
        if (err) {
            Promise.resolve(false);
        }

        Promise.resolve(true);
    });
}

exports.delete_file = async (path) => {
    try {
        return fs.unlinkSync(path)
        //file removed
    } catch (err) {
        logger.error(err, false, false);
    }
}



exports.path_exists = async (path) => {
    return _path_exists(path);
}