const request = require('supertest');
const app = require('./index');
const fs = require('fs-extra');
const path = require('path');

// Mock the pino logger to keep test output clean
jest.mock('pino', () => () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    silent: jest.fn(),
    level: 'silent',
}));

// Spy on fs.removeSync to check if it's called, without actually deleting files
const removeSyncSpy = jest.spyOn(fs, 'removeSync').mockImplementation(() => {});

describe('Profile Picture Updater API', () => {
    const authDir = path.join(__dirname, 'auth_info_baileys');
    const uploadDir = path.join(__dirname, 'uploads');
    const testImageName = 'test-image.png';
    const testImagePath = path.join(uploadDir, testImageName);

    beforeEach(async () => {
        // Clear mock history before each test
        removeSyncSpy.mockClear();
        // Ensure directories are clean before each test
        await fs.remove(authDir);
        await fs.remove(uploadDir);
        await fs.ensureDir(authDir);
        await fs.ensureDir(uploadDir);
        // Create a dummy file to upload
        await fs.writeFile(testImagePath, 'fake-image-data');
    });

    afterAll(async () => {
        // Clean up directories after all tests are done
        await fs.remove(authDir);
        await fs.remove(uploadDir);
        // Restore the original function
        removeSyncSpy.mockRestore();
    });

    // Use Jest's fake timers to control setTimeout
    jest.useFakeTimers();

    describe('/update-pp endpoint', () => {
        it('should NOT delete the auth directory after a successful update', async () => {
            // 1. Set the server to a 'CONNECTED' state using the test endpoint
            await request(app)
                .post('/test/set-state')
                .send({ state: 'CONNECTED', user_id: '12345@c.us' })
                .expect(200);

            // 2. Make the request to update the profile picture
            const response = await request(app)
                .post('/update-pp')
                .attach('profilePic', testImagePath);

            // Expect a successful response from the server
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // 3. Fast-forward the 3-second timer in `index.js`
            jest.runAllTimers();

            // 4. Assert that the removeSync function was NOT called with the auth directory path.
            // This assertion is designed to FAIL with the current buggy code.
            expect(removeSyncSpy).not.toHaveBeenCalledWith(authDir);
        });
    });
});
