const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const serverless_helper = require('../helpers/serverless');
const default_package = require('../templates/serverless/package');
const default_custom = require('../templates/serverless/custom');
const default_provider = require('../templates/serverless/provider');

class Serverless {
    constructor(serverless) {
        let doc = null;
        try {
            doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '../serverless.yml')}`, 'utf8'));
        } catch (e) {
            console.warn('couldnt find root serverless file, no errors will continue.')
        }
        this._serverless = {
            app: serverless.app || (doc ? doc.app : 'app'),
            service: serverless.service || (doc ? doc.service : 'service'),
            package: serverless.package || (doc ? doc.package : default_package),
            custom: serverless.custom || (doc ? doc.custom : default_custom),
            functions: serverless.functions || (doc ? (doc.functions || {}) : {}),
            provider: serverless.provider || (doc ? doc.provider : default_provider),
            plugins: serverless.custom || (doc ? doc.plugins : [])
        };
    }

    get app() {
        return this._serverless.app;
    }

    set app(_app) {
        this._serverless.app = _app;
    }

    get service() {
        return this._serverless.service;
    }

    set service(_service) {
        this._serverless.service = _service;
    }

    get package() {
        return this._serverless.package;
    }

    set package(_package) {
        this._serverless.package = _package;
    }

    get custom() {
        return this._serverless.custom;
    }

    set custom(_custom) {
        this._serverless.custom = _custom;
    }

    get functions() {
        return this._serverless.functions;
    }

    set functions(_functions) {
        this._serverless.functions = _functions;
    }

    get provider() {
        return this._serverless.provider;
    }

    set provider(_provider) {
        this._serverless.provider = _provider;
    }

    get plugins() {
        return this._serverless.plugins;
    }

    set plugins(_plugins) {
        this._serverless.plugins = _plugins;
    }

    async init(app, service) {
        this._serverless.app = app;
        this._serverless.service = service;
        // create all the directories well need
        await serverless_helper.init(
            app,
            service
        )
    }

    async addResources(resources, args) {
        return serverless_helper.addResources(resources, args);
    }

    async addFunction(args) {
        const new_function = await serverless_helper.addFunction(args);
        this._serverless.functions[new_function.name] = new_function.new_function;
        return true;
    }

    async addIamRole(args) {
        // TODO: not sure how to pass path here?
        if (!args || !args.path) throw new Error("path required")
        try {
            const new_iam_statement = await serverless_helper.addIamRole(args.path, args.service || 'ddb', args.api_name, args.bucket_name);
            if (!this._serverless.provider.iamRoleStatements) this._serverless.provider.iamRoleStatements = [];
            this._serverless.provider.iamRoleStatements.push(new_iam_statement);
            return true;
        } catch (e) {
            throw new Error(e);
        }
    }

    // merge(updatedData) {
    //     // Disallow changes from system generated variables
    //     const updatedKeys = Object.keys(this._serverless);
    //     updatedKeys.forEach((prop) => {
    //         if (Object.prototype.hasOwnProperty.call(updatedData, prop)) {
    //             this._serverless[prop] = updatedData[prop];
    //         }
    //     });
    // }

    export() {
        return this._serverless;
    }
}
module.exports = Serverless;
