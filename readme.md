# SainApiContext Package

The `SainApiContext` package provides a convenient way to interact with APIs using context-based authentication and session management.

## Installation

You can install the package via npm:

```bash
npm install sain-api-context
```
## Usage

To use the SainApiContext class, you need to instantiate it with the required parameters:

```bash
const ApiContext = require('sain-api-context');

// Instantiate ApiContext with required parameters
const apiContext = new ApiContext(
    {   
      endpoint: process.env.API_ENDPOINT,
      apiKey: process.env.SANDBOX_API_KEY,
      publicKey:process.env.PUBLIC_KEY
    },
    {encryptionAlgorithm:"RSAES-PKCS1-V1_5"} //its also a default
);
```
## Methods
`setSessionID(sessionUrl)`
This method fetch and sets the session ID for the API context. It requires the API key to be set beforehand.
```bash
try {
  if(apiContext.setSessionID('/getSession/')){
  console.log('Session ID set successfully:');
  };
} catch (error) {
  console.error('Error setting session ID:', error);
}
```
`request(url, method, data)`
This method makes a request to the API using the specified URL, HTTP method, and data payload.
```bash
try {
  const response = await apiContext.request('/api/resource', 'GET');
  console.log('Response:', response.data);
} catch (error) {
  console.error('Error making request:', error);
}
```
## License
This package is open source and available under the MIT License

```bash

Feel free to adjust and expand the content of the `README.md` file according to your package's features and usage instructions. This README will help users understand how to use your `ApiContext` class effectively.
```