after(() => {
    it('delete serverless', () => {
        return new Promise(async resolve => {
            console.log("HIT AFTER FUNCTION!")
            // TODO: this path stuff is way too confusing need to somehow reference parent dir.
            await file.delete_file(`${path.join(__dirname, '../../')}/serverless.yml`);
            await file.delete_file(`${path.join(__dirname, '../../')}/package2.json`);
            await file.force_delete_directory(`${path.join(__dirname, '../../')}aws`);
            await file.force_delete_directory(`${path.join(__dirname, '../../')}application`);
            resolve();
        })
    })
})

describe('Cleanup', () => {
    return new Promise(resolve => {
        console.log('clean up complete.');
        resolve();
    })
})