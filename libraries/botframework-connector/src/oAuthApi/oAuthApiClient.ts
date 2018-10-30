/*
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

import * as msRest from "ms-rest-js";
import * as Models from "./models";
import * as Mappers from "./models/mappers";
import * as operations from "./operations";
import { OAuthApiClientContext } from "./oAuthApiClientContext";

class OAuthApiClient extends OAuthApiClientContext {
  // Operation groups
  botSignIn: operations.BotSignIn;
  userToken: operations.UserToken;

  /**
   * Initializes a new instance of the OAuthApiClient class.
   * @param credentials Subscription credentials which uniquely identify client subscription.
   * @param [options] The parameter options
   */
  constructor(credentials: msRest.ServiceClientCredentials, options?: Models.OAuthApiClientOptions) {
    super(credentials, options);
    this.botSignIn = new operations.BotSignIn(this);
    this.userToken = new operations.UserToken(this);
  }
}

// Operation Specifications

export {
  OAuthApiClient,
  OAuthApiClientContext,
  Models as OAuthApiModels,
  Mappers as OAuthApiMappers
};
export * from "./operations";
