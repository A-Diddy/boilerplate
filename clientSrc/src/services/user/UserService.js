import {IoAPI} from "@/services/io";
import {QueryAPI} from "@/services/query";
import {MediaAPI} from "@/services/media";
import {expireSession, getConnectionSettings} from "@/utils/appUtils"


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
  return window.GLOBAL_CONFIG.config?.auth?.exp > new Date()/1000;
}

/************************************************
 * Clear/expire auth session.
 *
 * @returns {boolean}
 ************************************************/
export const clearAuth = () => {
  expireSession();
}

