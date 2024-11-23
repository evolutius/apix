/**
 * A access level enumeration.
 * 
 * Access levels are used as a mechanism for access control. It
 * determines two aspects for each request to a method:
 * 1. Whether a requestor has access to a method and its resources; and,
 * 2. The amount of access or ownership to said method and its resources.
 * 
 * The highest level of access is `Admin`, and the lowest is `Public`.
 * 
 * @category Resource Access Permissions
 * @enum
 */
export enum ApiXAccessLevel {
  /**
   * Highest level of access. This should only be used for internal
   * or extremely private resources. This level of access should be
   * used sparringly and only granted to admin-level super users.
   */
  Admin = 0,

  /**
   * This level of access is best used for confidential, private or
   * restricted resources. 
   * 
   * A requestor should only have this level if they are high-level users
   * such as content moderators or editors that have access to actions such as
   * deleting other users posts or similar actions.
   */
  Moderator,

  /**
   * This level of access is best reserved for owner-level private
   * resources. For example, if your service requires a person's ID or
   * Social Security Number, it may be restricted only if a user has
   * this level of access or higher.
   * 
   * A requestor should only be granted this level of access if they
   * own the sources they are requesting or they manage it. For example,
   * if your API is service for a bank, certain employees may be able
   * to access the customer's ID.
   */
  Manager,

  /**
   * This access level further refines group-based access to resources,
   * but it's less restricted than `Manager`.
   * 
   * A requestor should only be granted this level of access if they have
   * been granted some special privilege access to the resource, e.g., a
   * Beta tester for your application.
   */
  PrivilegedRequestor,

  /**
   * This level of access is best used for resource owners.
   * 
   * A requestor should only be granted this level of access if they own
   * the data they are requesting. For example, a user is requesting personal
   * information about themselves.
   */
  ResourceOwner,

  /**
   * This level of access is best used to access impersonal information that
   * any authorized app with authenticated users can access.
   * 
   * A requestor that is authenticated should have at least this level of
   * access.
   */
  AuthenticatedRequestor,

  /**
   * Lowest level of access. This level is best used for public resources.
   * 
   * At this point, personal user authentication should not even be required, and
   * any requestor with a valid request has at least this level of access.
   */
  PublicRequestor,

  /**
   * This access level literally means a requestor should not have access to
   * any methods, even `AuthenticatedUser` methods.
   * 
   * Requestors that have been explicitly denied access to resources should have
   * this access level. For example, a requestor that your application has
   * banned or determined to be a malicious actor or bot can have this access
   * level.
   */
  NoAccess
}
