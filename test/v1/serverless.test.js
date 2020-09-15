const {assert} = require('chai');
require('chai').should();
const mock = require('../mock/data');
const serverless = require('../../helpers/serverless');
const logger = require('../../helpers/logger');
const file = require('../../helpers/file');
const config = require('../../helpers/config');

describe('Test Serverless Generator', async () => {
    return serverless.init({
        app: mock.properties.app,
        service: mock.properties.service
    }).then((_serverless) => {
        console.log('here1')
        describe('#_serverless', () => {
            assert.equal(_serverless.app, mock.properties.app);
        });
        // TODO: i think this will need to be changed if this is going to be a package
        // await file.delete_file('./serverless.yml');
    })

    // describe('#constructor()', () => {
    //     it('steward is Steward instance', () => {
    //         const steward = new Steward(mock.getStewardData());
    //         assert.equal(steward instanceof Steward, true);
    //     });
    //     it('steward took initial values', () => {
    //         const steward = new Steward(mock.getStewardData());
    //         steward.should.have.property('_steward');
    //     });
    // });
    // describe('#export()', () => {
    //     it('steward export expected values', () => {
    //         const steward = new Steward(mock.getStewardData());
    //         assert.deepEqual(steward.export(), {
    //             stewardship_activity_id: mock.properties.guid,
    //             steward_id: mock.properties.guid.replace(/a/g, 's'),
    //             external_reference_id: mock.properties.guid.replace(/a/g, 'e'),
    //             first_name: mock.properties.name.split(' ')[0],
    //             last_name: mock.properties.name.split(' ')[1],
    //             phone: mock.properties.phone,
    //             email: mock.properties.email,
    //             created: mock.properties.date,
    //             modified: mock.properties.date
    //         });
    //     });
    // });
    // describe('#merge()', () => {
    //     it('steward merged expected values', () => {
    //         const steward = new Steward(mock.getStewardData());
    //         const cached_stewardship_activity_id = steward.stewardship_activity_id;
    //         const cached_steward_id = steward.steward_id;
    //         steward.merge({steward_id: '11122233445', stewardship_activity_id: '11122233445', external_reference_id: 'test-change-should-work'});
    //         assert.equal(steward.steward_id, cached_steward_id);
    //         assert.equal(steward.stewardship_activity_id, cached_stewardship_activity_id);
    //         assert.equal(steward.external_reference_id, 'test-change-should-work');
    //     });
    // });
});