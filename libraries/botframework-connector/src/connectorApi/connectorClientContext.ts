/*
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

import * as Models from "botframework-schema";
import * as msRest from "ms-rest-js";

const packageName = "botframework-connector";
const packageVersion = "4.0.0";

export class ConnectorClientContext extends msRest.ServiceClient {
  credentials: msRest.ServiceClientCredentials;

  /**
   * Initializes a new instance of the ConnectorClientContext class.
   * @param credentials Subscription credentials which uniquely identify client subscription.
   * @param [options] The parameter options
   */
  constructor(credentials: msRest.ServiceClientCredentials, options?: Models.ConnectorClientOptions) {
    if (credentials === null || credentials === undefined) {
      throw new Error('\'credentials\' cannot be null.');
    }

    if (!options) {
      options = {} as Models.ConnectorClientOptions;
    }

    super(credentials, options);

    this.baseUri = options.baseUri || this.baseUri || "https://api.botframework.com";
    this.requestContentType = "application/json; charset=utf-8";
    this.credentials = credentials;

    this.addUserAgentInfo(`${packageName}/${packageVersion}`);
  }
}
