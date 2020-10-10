const { node_versions_string, python_versions_string, java_versions_string } = require('../helpers/runtimes');
const aws_config_helper = require('../../helpers/aws');
const { acceptableBoolean } = require('../helpers/boolean');

let STATE = "INIT";

const _runtimeMapper = {
  node: node_versions_string,
  python: python_versions_string,
  java: java_versions_string
}

const _config_questions = [
  {
    type    : 'input',
    name    : 'profile_name',
    message : `\n\nWhat's the profile name (example: dev, tools, dns)?\n\n>`
  },
  {
    type    : 'input',
    name    : 'region',
    message : `\n\nWhat's the region? (default: us-east-2)\n\n>`
  },
  {
    type    : 'input',
    name    : 'account_id',
    message : `\n\nWhat's the account id (12 digit account ID found in AWS)?\n\n>`
  },
  {
    type    : 'input',
    name    : 'role_name',
    message : `\n\nWhat's the role name (found at the end of the IAM role ARN: arn:aws:iam::111111111111:role/ROLE_NAME_HERE)?\n\n>`
  },
  {
    type    : 'input',
    name    : 'mfa_serial',
    message : `\n\nWould you like to include a MFA serial for this profile? (press enter if no, otherwise it should look like this: arn:aws:iam::YOUR_ACCOUNT_ID_HERE:mfa/YOUR_MFA_EMAIL_HERE\n\n>`
  }
];

const _credentials_questions = [
  {
    type    : 'input',
    name    : 'profile_name',
    message : `\n\nWhat's the profile name?\n\n>`
  },
  {
    type    : 'input',
    name    : 'access_key',
    message : `\n\nWhat's the access key id?\n\n>`
  },
  {
    type    : 'input',
    name    : 'secret_key',
    message : `\n\nWhat's the secret access key?\n\n>`
  },
  {
    type    : 'input',
    name    : 'region',
    message : `\n\nWhat's the region? (default: us-east-2)\n\n>`
  }
];

const _profile_loop  = async _this => {
  const main_menu_choice = await _this.prompt([
    {
      type    : 'input',
      name    : 'configuring_aws_option',
      message : `========================== \n\n CONFIGURING AWS \n\n ========================== \n Type the corresponding number and press enter:\n\n 1) Add config profile \n 2) Add credential profile \n 3) Exit AWS Configuration (default 3)\n\n`
    }
  ]);
  console.log('logging main_menu_choice', main_menu_choice, typeof main_menu_choice.configuring_aws_option);

  if(main_menu_choice.configuring_aws_option && main_menu_choice.configuring_aws_option !== '3' && (main_menu_choice.configuring_aws_option === '1' || main_menu_choice.configuring_aws_option === '2')) {
    STATE = "SET_UP_PROFILE";
    let questions = [];

    if(main_menu_choice.configuring_aws_option === '1') {
      questions = _config_questions;
    } else if(main_menu_choice.configuring_aws_option === '2') {
      questions = _credentials_questions;
    }

    const responses = await _this.prompt(questions);

    if(main_menu_choice.configuring_aws_option === '1') {
      const { profile_name, account_id, role_name, region = 'us-east-2', mfa_serial = false } = responses;
      await aws_config_helper.addProfile(profile_name, account_id, role_name, mfa_serial, region);
    } else if(main_menu_choice.configuring_aws_option === '2') {
      const { access_key, secret_key, profile_name, region = 'us-east-2' } = responses;
      await aws_config_helper.addCredentials(access_key, secret_key, profile_name, region);
    }
  } else {
    STATE = "AWS_PROFILE_COMPLETE";
  }

  return true;
}

exports.default = async _this => {
  const runtime = await _this.prompt([
    {
      type    : 'input',
      name    : 'runtime',
      message : `What runtime would you like this project to be? (example: node, python, java. default: node)`
    }
  ])

  const _runtime = runtime.runtime || 'node';

  const base = [
    {
      type    : 'input',
      name    : 'runtime_version',
      message : `What runtime version would you like?\n\nsupported: ${_runtimeMapper[_runtime]}\n\n(default: latest stable version)\n\n>`
    },
    {
      type    : 'input',
      name    : 'app',
      message : `What would you like to call your serverless app?`
    },
    {
      type    : 'input',
      name    : 'service',
      message : `What would you like to call your serverless service?`
    },
    {
      type    : 'input',
      name    : 'aws_profiles',
      message : `Would you like to add any AWS profiles to your config?`
    }
  ];

  const base_questions =  await _this.prompt(base);
  console.log('logging base_questions', base_questions);
  const aws_profiles = acceptableBoolean(base_questions.aws_profiles);
  console.log('logging aws_profiles', aws_profiles);

  if(aws_profiles) {
    STATE = "SET_UP_PROFILE";
    while(STATE === "SET_UP_PROFILE") {
      await _profile_loop(_this);
    }
  }

  return {
    ...runtime,
    ...base_questions
  };
}