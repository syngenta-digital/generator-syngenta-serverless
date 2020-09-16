const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const default_package = require('../templates/serverless/package');
const default_custom = require('../templates/serverless/custom');
const serverless_helper = require('../helpers/serverless');

class Serverless {
    constructor(serverless) {
        let doc = null;
        try {
            doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '../serverless.yml')}`, 'utf8'));
        } catch(e) {
            console.warn('couldnt find root serverless file, no errors will continue.')
        }
        this._serverless = {
            app: serverless.app || (doc ? doc.app : 'app'),
            service: serverless.service || (doc ? doc.service : 'app'),
            package: serverless.package || (doc ? doc.package : default_package),
            custom: serverless.custom || (doc ? doc.custom : default_custom),
            functions: serverless.custom || (doc ? doc.functions : []),
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

    get functions() {
        return this._serverless.functions;
    }

    set functions(_functions) {
        this._serverless.functions = _functions;
    }

    async init(app, service) {
        this._serverless.app = app;
        this._serverless.service = service;
        await serverless_helper.init(
            app,
            service
        )
    }

    async addFunction(args) {
        const new_function = await serverless_helper.addFunction(args);
        this._serverless.functions.push(new_function);
    }

    merge(updatedData) {
        // Disallow changes from system generated variables
        const updatedKeys = Object.keys(this._serverless);
        updatedKeys.forEach((prop) => {
            if (Object.prototype.hasOwnProperty.call(updatedData, prop)) {
                this._serverless[prop] = updatedData[prop];
            }
        });
    }

    export() {
        return this._serverless;
    }
}
module.exports = Serverless;
