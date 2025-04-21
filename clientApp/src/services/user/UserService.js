import {IoAPI} from "../io";
import {QueryAPI} from "../query";
import {MediaAPI} from "../media";
import {expireSession, getConnectionSettings} from "../../utils/appUtils";


const ioService = new IoAPI(getConnectionSettings()).io;
const QueryService = new QueryAPI(getConnectionSettings()).query;
const MediaService = new MediaAPI(getConnectionSettings()).media;

/**************************************************
 * User Service
 *
 *   Collection of services to interact with user
 *   data.
 **************************************************/

const USERS_TABLE = "users";
const PROFILES_TABLE = "profiles";


/**************************************************
 * Get user by ID.
 *
 *    Gets a single user by ID.
 *
 * @param userId
 * @returns {Promise<object>}
 **************************************************/
export const getUserById = (userId) => {
  return ioService.getById(USERS_TABLE, userId)
    .then((result) => {
      return result;
    })
}

/**************************************************
 * Get users.
 *
 *    Provide a QueryServiceFilter object to get back
 *    a promise to a list of users. A null query object
 *    will attempt to fetch each user
 *    (up to configured DB limit).
 *
 * @param {object} query: [OPTIONAL] QueryServiceFilter object with query conditions
 * @returns {Promise<[]>} Array of users
 **************************************************/
export const getUsers = (query = null) => {
  return QueryService.query(query, USERS_TABLE)
    .then((results) => {
      const resultArray = [];
      results.forEach((result) => {
        resultArray.push(results.json_data);
      })
      return resultArray;
    })
}

/**************************************************
 * Get users for current user's org.
 *
 *    Get a list of users associated with current
 *    user's org.
 *
 * @param {string} orgId: OrgID to get users for.
 * @returns {Promise<[]>} Array of users
 **************************************************/
export const getUsersByOrg = (orgId = null) => {
  orgId = orgId || window.GLOBAL_CONFIG.config.user?.org || null;

  let query = {
    conditions: [{
      path: "orgId",
      operator: "=",
      value: orgId
    }]
  }

  if (!orgId) {query = null;}     // This is really just for testing and shouldn't happen in prod.

  return QueryService.query(query, USERS_TABLE)
    .then((results) => {
      const resultArray = [];
      results.forEach((result) => {
        resultArray.push(result.json_data);
      })
      return resultArray;
    })
}

/************************************************
 * Is current user auth token valid?
 *
 * @returns {boolean}
 ************************************************/
export const isAuthenticated = () => {
  console.log("[UserService] isAuthenticated(): window.GLOBAL_CONFIG.config?.session?.expires ", new Date(window.GLOBAL_CONFIG.config?.session?.expires).getTime());
  console.log("[UserService] isAuthenticated(): new Date()/1000 ",new Date().getTime());
  console.log("[UserService] isAuthenticated(): returning ", !(new Date(window.GLOBAL_CONFIG.config?.session?.expires).getTime() < new Date().valueOf()));
  //return window.GLOBAL_CONFIG.config?.auth?.exp > new Date()/1000;

  // Session is active is a username/id exists (from cookies)
  // and session expiration is null or greater than current time...

  const username = window.GLOBAL_CONFIG.config?.user?.username;
  const expires = window.GLOBAL_CONFIG.config?.session?.expires;

  if (typeof username === "string"
    && username !== ""
    && username !== "anonymous") {
    console.log("1");
    if (expires !== null) {
      console.log("2");
      return (new Date(expires).getTime() > new Date().getTime());
    }
    console.log("3");
    return true;
  }
  console.log("4");
  return false;

}

/************************************************
 * Clear/expire auth session.
 *
 * @returns {boolean}
 ************************************************/
export const clearAuth = () => {
  console.log("[UserService] clearAuth(): Calling 'expireSession()'")
  expireSession();
}
