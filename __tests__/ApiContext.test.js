const APIContext = require('../dist/ApiContext');
require('dotenv').config();
describe('APIContext', () => {
    let apiContext = new APIContext({
        endpoint: process.env.MPESA_ENDPOINT,
        apiKey: process.env.SANDBOX_MPESA_API_KEY,
        publicKey:process.env.PUBLIC_KEY},{encryptionAlgorithm:"RSAES-PKCS1-V1_5"});
  it('should set session ID', async () => {
    try {
       let res = await apiContext.setSessionID('/getSession');
        // If the code reaches here without throwing an error, the test passes
        expect(res).toBe(true); // Example assertion
    } catch (error) {
        throw error;
    }
    // Write your test logic here
  });
  it('should encrypt session ID', async () => {
    try {
       let res = await apiContext.encryptSessionKey();
        // If the code reaches here without throwing an error, the test passes
        console.log("encrypted session id key ====>> ", res);
        expect(res).not.toBeNull(); // Example assertion
    } catch (error) {
        throw error;
    }
    // Write your test logic here
  });

  // Add more test cases for other methods
});
