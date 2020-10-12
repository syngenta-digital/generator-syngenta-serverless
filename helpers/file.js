const fs = require('fs');
const os = require('os');
const fs_extra = require('fs-extra');
const yaml = require('js-yaml');
const path = require('path');
const rimraf = require("rimraf");
const logger = require('./logger');
const config = require('./config');
const { schema, yamlParse, yamlDump } = require('yaml-cfn');
const { CLOUDFORMATION_SCHEMA } = require('js-yaml-cloudformation-schema');

const test_schema = {
	"title": "JSON Schema for serverless framework",
	"$schema": "http://json-schema.org/draft-04/schema#",
	"type": "object",
	"required": ["service", "provider"],
	"properties": {
		"service": {
			"type": "string",
			"description": "Unique service identifier"
		},
		"frameworkVersion": {
			"type": "string",
			"description": "Serverless framework version"
		},
		"custom": {
			"type": "object",
			"description": "Custom service configuration",
			"additionalItems": true
		},
		"functions": {
			"type": "object",
			"description": "Function definitions",
			"patternProperties": {
				"^.*$": {
					"type": "object",
					"description": "Function definition",
					"properties": {
						"handler": {
							"type": "string",
							"description": "Function entrypont. Syntax will vary by runtime"
						},
						"events": {
							"type": "array",
							"description": "List of event triggers",
							"items": {
								"type": "object",
								"description": "Event configuration",
								"patternProperties": {
									"http": {
										"oneOf": [{
											"type": "string",
											"description": "API Gateway HTTP trigger"
										}, {
											"type": "object",
											"description": "API Gateway HTTP trigger",
											"required": ["path", "method"],
											"properties": {
												"path": {
													"type": "string",
													"description": "HTTP path that will trigger function"
												},
												"method": {
													"type": "string",
													"description": "HTTP method that will trigger function",
													"default": "get"
												}
											}
										}]
									}
								}
							}
						}
					}
				}
			}
		},
		"package": {
			"type": "object",
			"description": "Function packaging configuration",
			"properties": {
				"individually": {
					"type": "boolean",
					"description": "Individual packaging for each function. If true you must provide package for each function. Defaults to false",
					"default": false
				},
				"exclude": {
					"type": "array",
					"description": "List of exclude patterns",
					"items": {
						"type": "string",
						"description": "Package exclusion pattern"
					}
				},
				"include": {
					"type": "array",
					"decription": "List of include patterns",
					"items": {
						"type": "string",
						"description": "Package inclusion pattern"
					}
				}
			}
		},
		"plugins": {
			"type": "array",
			"description": "Serverless framework plugins",
			"items": {
				"type": "string",
				"description": "plugin identifier"
			}
		},
		"provider": {
			"type": "object",
			"description": "FaaS provider settings",
			"required": ["name"],
			"properties": {
				"name": {
					"type": "string",
					"description": "FaaS provider name",
					"enum": ["aws", "google"],
					"default": "aws"
				},
				"runtime": {
					"type": "string",
					"description": "AWS Lambda runtime",
					"enum": ["nodejs8.10", "nodejs6.10", "python3.6", "python3.7", "python2.7", "ruby2.5", "java8", "go1.x", "dotnetcore2.1", "dotnetcore2.0", "dotnetcore1.0", "provided", "rust"],
					"default": "provided"
				},
				"memorySize": {
					"type": "number",
					"description": "Default amount of memory to allocate per function",
					"enum": [128, 256, 512],
					"default": 128
				},
				"stackName": {
					"type": "string",
					"description": "custom name for the CloudFormation stack"
				},
				"apiName": {
					"type": "string",
					"description": "custom name for the API gateway"
				},
				"profile": {
					"type": "string",
					"description": "default profile for this service"
				},
				"timeout": {
					"type": "number",
					"description": "amount of time in seconds to timeout lambda",
					"default": 6
				},
				"logRetentionInDays": {
					"type": "number",
					"description": "number of days to keep streams in a cloud watch log group",
					"default": 14
				},
				"deploymentPrefix": {
					"type": "string",
					"description": "S3 prefix under which deployed artifacts should be stored",
					"default": "serverless"
				},
				"versionFunctions": {
					"type": "boolean",
					"description": "Optional function versioning",
					"default": false
				},
				"environment": {
					"type": "object",
					"description": "Service wide environment variables",
					"patternProperties": {
						"^.*$": {
							"type": "string",
							"description": "env entry"
						}
					}
				},
				"endpointType": {
					"type": "string",
					"description": "Optional endpoint configuration for API Gateway REST API",
					"enum": ["edge", "regional"],
					"default": "edge"
				},
				"region": {
					"type": "string",
					"description": "What region to deploy this function in",
					"default": "us-east1"
				},
				"stackTags": {
					"type": "object",
					"description": "optional stack tags",
					"patternProperties": {
						"^.*$": {
							"type": "string",
							"description": "value"
						}
					}
				},
				"tags": {
					"type": "object",
					"description": "Optional service wide function tags",
					"patternProperties": {
						"^.*$": {
							"type": "string",
							"description": "value"
						}
					}
				}
			}
		}
	}
}

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

const _write_yaml = (target_path, obj) => {
    return new Promise(async resolve => {
        let convert_object_to_yaml = yaml.safeDump(obj, { indent: 4 })
        convert_object_to_yaml = convert_object_to_yaml.replace(/'Fn::GetAtt'/g, 'Fn::GetAtt');
        convert_object_to_yaml = convert_object_to_yaml.replace(/'Ref'/g, 'Ref');
        fs.writeFile(target_path, convert_object_to_yaml, (err) => {
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