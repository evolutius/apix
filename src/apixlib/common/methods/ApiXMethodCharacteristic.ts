
/**
 * Characteristics that API-X endpoints may posses.
 * 
 * These characteristics are used to limit access to resources, operations, and endpoints
 * by clearance level.
 * 
 * @category Working with HTTP Endpoints
 * @enum
 * 
 * @see {@link ApiXMethod#characteristics}
 */
export const enum ApiXMethodCharacteristic {
  /**
   * An endpoint that is internal and should only be used by API owners or administrators.
   */
  Internal = 0,

  /**
   * An endpoint that is meant to be used by moderators of the API and its reasources.
   */
  Moderative,

  /**
   * An endpoint that contains resources that should only be available to specific institutions,
   * such as groups of employees within a company.
   */
  Institutional,

  /**
   * An endpoint with special priveleges operations or data, such as beta testing endpoints.
   */
  Special,

  /**
   * An endpoint that processes or serves privately owned data, e.g., a user's phone number.
   */
  PrivateOwnedData,

  /**
   * An endpoint that processes or serves public owned data, e.g., data owned by a user,
   * application, or group but that can be consumed by the public.
   */
  PublicOwnedData,

  /**
   * An endpoint that processes or servers public unowned data, e.g., data that isn't owned
   * by a specific user, application, or group.
   */
  PublicUnownedData
}
