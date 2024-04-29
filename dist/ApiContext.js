const { readFileSync } = require("fs");
const axios = require("axios");
const https = require("https");
const forge = require("node-forge");
class APIContext {
    static #publicKey = "";
    static #apiKey = "";
    static encryptionAlgorithm = "RSAES-PKCS1-V1_5";
  constructor(params={
    endpoint: process.env.MPESA_ENDPOINT,
    apiKey: process.env.SANDBOX_MPESA_API_KEY,
    publicKey:process.env.PUBLIC_KEY,
  }, options={encryptionAlgorithm:"RSAES-PKCS1-V1_5"}) {
    if (!params.endpoint || !params.apiKey || !params.publicKey) {
        throw new Error('Required environment variables are missing.');
    }
    this.apiUrl = params.endpoint;
    APIContext.#apiKey = params.apiKey;
    APIContext.encryptionAlgorithm = options?.encryptionAlgorithm || "RSAES-PKCS1-V1_5";
    this.session_id = null;
    this.sessionUrl = null;
    this.sessionAxios= null;
    this.#setPublicKey(params.publicKey);
    this.#setApiKey(params.apiKey);
  }

  #DEFAULT_ALGORITHM = "RSAES-PKCS1-V1_5";
  #SESSION;
  getSession(){
    if (this.session_id) {
      return this.session_id;
    }
    throw new Error("Session not initialized");
  }
  #setPublicKey(key) {
    APIContext.#publicKey =key;
  }

  #setApiKey(key) {
    APIContext.#apiKey =key;
  }

  getPublicKey() {
    return APIContext.#publicKey;
  }

  getApiKey() {
    return APIContext.#apiKey;
  }

  async createBearerToken() {
    try {
      // Step 1: Decoding the base64 public key
      const publicKey = await forge.pki.publicKeyFromPem(
        await this.getPublicKey()
      );

      // Step 2: Encrypt API key with RSA public key
      const encryptedApiKey = await publicKey.encrypt(
        this.getApiKey(),
        APIContext.encryptionAlgorithm
      );

      // Step 3: Encode encrypted API key as Base64
      return await forge.util.encode64(encryptedApiKey);
    } catch (error) {
      console.error("Error creating bearer token:", error);
      throw error;
    }
  }

  async encryptSessionKey() {
    try {
        console.log(this.session_id, this.#DEFAULT_ALGORITHM);
        if(!this.session_id){
            throw new Error("Session ID not Assigned");
        }
      // Step 1: Decoding the base64 public key
      const publicKey = await forge.pki.publicKeyFromPem(
        await this.getPublicKey()
      );
      // Step 2: Encrypt API key with RSA public key
      const encryptedSessionKey = await publicKey.encrypt(
        this.session_id,
        this.#DEFAULT_ALGORITHM
      );

      // Step 3: Encode encrypted API key as Base64
      return await forge.util.encode64(encryptedSessionKey);
    } catch (error) {
      console.error("Error creating bearer token:", error);
      throw error;
    }
  }

  async setSessionID(sessionUrl=null) {
    try {
        this.sessionUrl =!sessionUrl===null?sessionUrl:"/getSession/";
        const token = await this.createBearerToken();

        const instance = await axios.create({
          baseURL: this.apiUrl,
          headers: {
            Origin: "*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const { data } = await instance.get(this.sessionUrl);
        this.session_id = data.output_SessionID;
        this.sessionAxios = instance;
        return true;
    } catch (error) {
        throw error;
    }
   
  }

  async request(url, method, data = null, options = {}) {
    try {
      if (!this.session_id) {
        await this.setSessionID(this.sessionUrl);
      }
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      const instance = await axios.create({
        baseURL: this.apiUrl,
        httpsAgent: agent,
        headers: {
          Origin: "*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.encryptSessionKey()}`,
        },
      });
      const response = await instance.request({
        url,
        method,
        data,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

}

module.exports = {APIContext};
