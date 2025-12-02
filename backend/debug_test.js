global.describe = () => { };
global.it = () => { };
global.expect = () => { };
global.beforeAll = () => { };
global.afterAll = () => { };

try {
    console.log('Attempting to require auth.test.js...');
    require('./tests/integration/auth.test.js');
    console.log('Require successful');
} catch (e) {
    console.error('Require failed:', e);
}
