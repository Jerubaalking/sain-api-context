const { readFileSync } = require("fs");
const axios = require("axios");
const https = require("https");
const forge = require("node-forge");

class APIContext {
  #publicKey = "";
  #apiKey = "";
  #encryptionAlgorithm = "RSAES-PKCS1-V1_5";
  #DEFAULT_ALGORITHM = "RSAES-PKCS1-V1_5";

  constructor(
    params = {
      endpoint: process.env.MPESA_ENDPOINT,
      apiKey: process.env.SANDBOX_MPESA_API_KEY,
      publicKey: process.env.PUBLIC_KEY,
    },
    options = { encryptionAlgorithm: "RSAES-PKCS1-V1_5" }
  ) {
    if (!params.endpoint || !params.apiKey || !params.publicKey) {
      throw new Error("Required environment variables are missing.");
    }
    this.apiUrl = params.endpoint;
    this.#apiKey = params.apiKey;
    this.#publicKey = params.publicKey;
    this.#encryptionAlgorithm =
      options?.encryptionAlgorithm || this.#DEFAULT_ALGORITHM;

    this.session_id = null;
    this.sessionUrl = null;
    this.sessionAxios = null;
  }

  getSession() {
    if (this.session_id) return this.session_id;
    throw new Error("Session not initialized");
  }

  getPublicKey() {
    return this.#publicKey;
  }

  getApiKey() {
    return this.#apiKey;
  }

  async createBearerToken() {
    try {
      const publicKey = forge.pki.publicKeyFromPem(this.#publicKey);
      const encryptedApiKey = publicKey.encrypt(
        this.#apiKey,
        this.#encryptionAlgorithm
      );
      return forge.util.encode64(encryptedApiKey);
    } catch (error) {
      console.error("Error creating bearer token:", error);
      throw error;
    }
  }

  async encryptSessionKey() {
    try {
      if (!this.session_id) {
        throw new Error("Session ID not Assigned");
      }
      const publicKey = forge.pki.publicKeyFromPem(this.#publicKey);
      const encryptedSessionKey = publicKey.encrypt(
        this.session_id,
        this.#DEFAULT_ALGORITHM
      );
      return forge.util.encode64(encryptedSessionKey);
    } catch (error) {
      console.error("Error encrypting session key:", error);
      throw error;
    }
  }

  async setSessionID(sessionUrl = "/getSession/") {
    try {
      this.sessionUrl = sessionUrl;
      const token = await this.createBearerToken();

      const instance = axios.create({
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
        await this.setSessionID(this.sessionUrl || "/getSession/");
      }
      const agent = new https.Agent({ rejectUnauthorized: false });
      const instance = axios.create({
        baseURL: this.apiUrl,
        httpsAgent: agent,
        headers: {
          Origin: "*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.encryptSessionKey()}`,
        },
      });
      const response = await instance.request({ url, method, data });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = APIContext;