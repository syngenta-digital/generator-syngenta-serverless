const dbBuilder = require('./dbBuilder');
const version = require('./versionChecker');
const versioner = require('./versionApplicator');

const apply = async (params) => {
  console.log('==== VERSIONER STARTED ====');
  await version.check(params);
  await dbBuilder.build(params, 'versioner');
  await dbBuilder.build(params, 'application', true);
  await versioner.apply(params);
  console.log('==== VERSIONER COMPLETE ====');
  return Promise.resolve();
};

module.exports = {apply};
