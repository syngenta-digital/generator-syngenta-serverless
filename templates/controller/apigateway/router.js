exports.default = `const {Router} = require('syngenta-lambda-client').apigateway;

exports.route = (event) => {
    const router = new Router({
        event,
        app: process.env.APP,
        service: process.env.SERVICE,
        version: 'v1',
        handlerPath: 'application/v1/controller/apigateway'
    });
    return router.route();
};
`