const fs = require('fs');
const yaml = require('js-yaml');
const FileSystem = require('pwd-fs');
const { resolve } = require('path');
const path = require('path');
const rimraf = require("rimraf");
const logger = require('./logger');
const pfs = new FileSystem();

const _read_file = (path, do_not_parse_json) => {
    return new Promise((resolve) => {
        fs.readFile(path, null, (err, data) => {
            if (err) {
                logger.warn(err);
                resolve(null);
                return;
            }
            if(do_not_parse_json) resolve(data);
            else resolve(JSON.parse(data));
        });
    })
}

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

const _create_directory = path => {
    // if (!fs.existsSync(path)) {
    //     fs.mkdirSync(path);
    // }
    return new Promise(async resolve => {
        fs.access(path, (err) => {
            if (!err) {
                resolve();
                return;
            }

            fs.mkdir(path, null, () => {
                resolve();
            })
        });
    })


    // return true;
}

const _write_file = (path, data) => {
    return new Promise(async resolve => {
        try {
            fs.writeFile(path, data, null, () => {
                resolve(true)
            });
        } catch (e) {
            console.log('logging e', e);
            throw new Error(e);
        }
    });
}

const _write_yaml = (target_path, json) => {
    return new Promise(async resolve => {
        fs.writeFile(target_path, yaml.safeDump(json), (err) => {
            if (err) {
                logger.warn(err);
                resolve(false);
            }
    
            resolve(true);
        });
    })
}

const _copy_directory = async (src, dest) => {
    try {
        await pfs.copy(src, dest);
    } catch(e) {
        logger.warn(e);
    }
    return true;
}

exports.doesLocalDirectoriesExist = async (directories) => {
    for (const dir of directories) {
        const does_exist = await _path_exists(dir);
        if (!does_exist) await _create_directory(`${path.join(__dirname, '..')}/${dir}`);
    }

    return true;
}

exports.create_directory = async (path) => {
    return _create_directory(path);
}

exports.copy_directory = async (src, dest) => {
    return _copy_directory(src, dest);
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

exports.read_file = (path, do_not_parse_json) => {
    return _read_file(path, do_not_parse_json)
}

exports.read_yaml = async (path) => {
    const exists = await _read_file(path, true);
    if(!exists) return null;
    else return yaml.safeLoad(fs.readFileSync(path, 'utf8'));
}

exports.write_yaml = async (target_path, json) => {
    return _write_yaml(target_path, json);
}

exports.write_file = async (path, data) => {
    return _write_file(path, data)
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