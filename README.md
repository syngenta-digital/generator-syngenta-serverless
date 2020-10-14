# generator-serverless
Yeoman CLI tool to generate resources and environments needed to build a serverless project.

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Before installing, [download and install Node.js](https://nodejs.org/en/download/).
Node.js 0.10 or higher is required.

If this is a brand new project, make sure to create a `package.json` first with
the [`npm init`](https://docs.npmjs.com/creating-a-package-json-file) command.

Installation is done using the
[`npm install`](https://docs.npmjs.com/getting-started/installing-npm-packages-locally) command:

```NPM
$ npm install yeoman
$ npm install @syngenta-digital/generator-serverless
```

```NPM
$ npx -p yo -p @syngenta-digital/generator-serverless  -c 'yo @syngenta-digital/serverless'
```

## Contributing

Please lint and add unit tests.
To run unit tests, please do the following:

0. Have Docker Installed
1. run `npm install`
3. run `npm test` 
4. Happy Coding :)