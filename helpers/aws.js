const file = require('./file');
const os = require('os');
const fs = require('fs');

const _writeDefaults = async (region = 'us-east-2') => {
    const config_route = file.aws_config_route();
    // TODO: put this into our file helper, and unit test
    await fs.appendFileSync(config_route, `[profile default]${os.EOL}`);
    await fs.appendFileSync(config_route, `region=${region}${os.EOL}`);
    await fs.appendFileSync(config_route, `output=json${os.EOL}`);

    return true;
}

const _addProfile = async (profile_name, account_id, role_name, mfa_serial = false) => {
    const config_route = file.aws_config_route();
    // TODO: put this into our file helper, and unit test
    await fs.appendFileSync(config_route, `[profile ${profile_name}]${os.EOL}`);
    await fs.appendFileSync(config_route, `role_arn=arn:aws:iam::${account_id}:role/${role_name}${os.EOL}`);
    if(mfa_serial) await fs.appendFileSync(config_route, `mfa_serial=${mfa_serial}${os.EOL}`);

    return true;    
}

const _addCredentials = async (access_key, secret_key, name = 'default') => {
    const credential_route = file.aws_credentials_route();
    // TODO: put this into our file helper, and unit test
    await fs.appendFileSync(credential_route, `[${profile_name}]${os.EOL}`);
    await fs.appendFileSync(credential_route, `aws_access_key_id=${access_key}${os.EOL}`);
    await fs.appendFileSync(credential_route, `aws_secret_access_key=${secret_key}${os.EOL}`);

    return true;
}

exports.addProfile = async (profile_name, account_id, role_arn, mfa_serial = false, region = 'us-east-2') => {
    await _writeDefaults(region);
    return _addProfile(profile_name, account_id, role_arn, mfa_serial);
}

exports.addCredentials = async (access_key, secret_key, name, region = 'us-east-2') => {
    await _writeDefaults(region);
    return _addCredentials(access_key, secret_key, name);
}

exports.writeDefaults() = async (region) => {
    return _writeDefaults(region);
}

