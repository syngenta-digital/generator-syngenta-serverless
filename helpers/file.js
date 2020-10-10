const fs = require('fs');
const os = require('os');
const fs_extra = require('fs-extra');
const yaml = require('js-yaml');
const path = require('path');
const rimraf = require("rimraf");
const logger = require('./logger');
const config = require('./config');

const _find_aws_root_path = () => {
    switch(process.platform) {
        case 'win':
            return '%USERPROFILE%\\.aws\\config';
        case 'darwin':
        case 'linux':
            return `${os.homedir()}/.aws/`;
        default:
            throw new Error(`unsupported operating system ${process.platform}`)
    }
}

const _aws_config_route = () => {
    return `${_find_aws_root_path()}${process.env.SYNGENTA_SERVERLESS_DEBUG ? 'config2' : 'config2'}`;
}

const _aws_credentials_route = () => {
    return `${_find_aws_root_path()}${process.env.SYNGENTA_SERVERLESS_DEBUG ? 'credentials2' : 'credentials2'}`;
}

const _read_file = (path, do_not_parse_json) => {
    return new Promise((resolve) => {
        fs.readFile(path, null, (err, data) => {
            if (err) {
                logger.warn(err);
                resolve(null);
                return;
            }
            if(do_not_parse_json) resolve(data);
            else {
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    resolve(data);
                }
            }
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
    });
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

const _get_root_project_directory = (is_target_root) => {
    let root_path = `${path.join(__dirname, '..')}/`;
    if(is_target_root && !config.DEBUG) {
        const config_path = `${root_path}syngenta-generator-temp/config.yml`;
        try {
            const exists = fs.existsSync(config_path);
            if(exists) {
                const read_resource = yaml.safeLoad(fs.readFileSync(config_path, 'utf8'));
                if(read_resource.root) {
                    root_path = read_resource.root;
                }
            }
        } catch(e) {
            // dont need to do anything here
        }
    }

    return root_path;
}

exports.doesLocalDirectoriesExist = async (directories, is_target_root = true) => {
    for (const dir of directories) {
        const does_exist = await _path_exists(dir);
        if (!does_exist) await _create_directory(`${_get_root_project_directory(is_target_root)}${dir}`);
    }

    return true;
}

exports.create_directory = async (path) => {
    return _create_directory(path);
}

exports.copy_directory = async (src, dest) => {
    fs_extra.copy(src, dest, err => {
        if (err) return console.error(err)
    })
}

exports.copy_file = async (src, dest) => {
    return _copy_file(src, dest);
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
        return fs.unlinkSync(path);
    } catch (err) {
        logger.error(err, false, false);
    }
}

exports.path_exists = async (path) => {
    return _path_exists(path);
}

exports.root = (is_target_root) => {
    return _get_root_project_directory(is_target_root);
}

exports.aws_config_route = () => {
    return _aws_config_route();
}

exports.aws_credentials_route = () => {
    return _aws_credentials_route();
}

exports.aws_route = () => {
    return _find_aws_root_path();
}