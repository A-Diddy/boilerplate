import jwt_decode from "jwt-decode";
import jwt_encode from "jwt-encode";
import {AuthAPI} from "@/services/auth";
import * as UUID from "uuid";
import {MediaAPI} from "../services/media/index";

import { DateTime } from 'luxon';
import gravatar from "gravatar";
// const gravatar = require('gravatar');

let pendingPermissionRequest = null; // Used to ensure we only ever have one request pending for permissions
let privMap;
const DEFAULT_ROLE_TITLE = "Reach Talent, Inc.";

/****************************************************
 * Get permissions for current user.
 *
 *    Intended to be called whenever the session updates.
 *    This could be on login, logout or session refresh (in Session Mgr).
 *
 * @param force {Boolean}: Force a server request even if permissions exist (Default = false).
 * @returns {Promise<unknown>}: If a request is pending, a reference to it. Otherwise,
 * a resolved promise with the current permissions from memory.
 ****************************************************/
export const getPermissions = async (force = false) => {
  console.log("getPermisssions(",force,"): ");

  // If the user is not authenticated, they have no permissions.
  if (!isAuthenticated()) {
    return Promise.resolve({ permissions: [], role: "Guest" });
  }

  // If we already have the permissions, return them from memory
  if (window.GLOBAL_CONFIG?.config?.authorization && !force) {
    return Promise.resolve(window.GLOBAL_CONFIG.config.authorization);
  }

  // If we already have a pending request for permissions, return it (don't request permissions multiple times)
  if (pendingPermissionRequest && !force) {
    return pendingPermissionRequest;
  }

  // Otherwise, fetch permissions
  const authService = new AuthAPI(getConnectionSettings()).auth;

  return pendingPermissionRequest = authService.getPermissions()
    .then((results) => {
      console.log("Got permissions: ", results);
      window.GLOBAL_CONFIG.config.authorization = results;
      privMap = null;       // TODO: Reset privMap so it will be rebuilt on the next 'hasPriv()' call.
      return results;
    })
    .catch((e) => {
      console.log(e);
      return e;
    });

  console.log('window.GLOBAL_CONFIG (after permissions): ', window.GLOBAL_CONFIG);

  // return perm;
}

export const getConnectionSettings = (force = false) => {
  console.log("[AppUtils] getConnectionSettings(",force,")");
  window.GLOBAL_CONFIG = window.GLOBAL_CONFIG || {};
  window.GLOBAL_CONFIG.config = window.GLOBAL_CONFIG.config || {};
  window.GLOBAL_CONFIG.config.user = window.GLOBAL_CONFIG.config.user || {};
  window.GLOBAL_CONFIG.config.session = window.GLOBAL_CONFIG.config.session || {};

  if (window.GLOBAL_CONFIG.config.connectionSettings && !force) {
    return window.GLOBAL_CONFIG.config.connectionSettings;
  }

  // If connectionSettings has not been defined, define it
  const cookies = document.cookie.split('; ');
  cookies.forEach((cookie) => {
    const splitCookie = cookie.split('=');
    const cookieName = splitCookie[0];
    const cookieValue = splitCookie[1];

    // 1. Get CSRF token ('XSRF-TOKEN')
    if (cookieName.toLowerCase().includes('token')) {
      console.log("[App] Using token from cookie (", cookieName, "): ", cookieValue);
      window.GLOBAL_CONFIG.token = cookieValue;
    }

    // 2. Get User ID
    else if (cookieName.toLowerCase().includes('user-id')) {
      console.log("[App] Using user ID from cookie (", cookieName, "): ", cookieValue);
      window.GLOBAL_CONFIG.config.user.id = cookieValue;
    }

    // Get User name (for display use only)
    else if (cookieName.toLowerCase().includes('user-name')) {
      console.log("[App] Using username from cookie (", cookieName, "): ", cookieValue);
      window.GLOBAL_CONFIG.config.user.username = decodeURI(cookieValue);
    }

    else if (cookieName.toLowerCase().includes('expires')) {
      console.log("[App] Using expires from cookie (", cookieName, "): ", cookieValue);
      const expiresValue = decodeURIComponent(cookieValue);
      console.log("[App] decoded expiresValue = ", expiresValue);

      if (typeof expiresValue === "string" && expiresValue.endsWith("Z")) {
        window.GLOBAL_CONFIG.config.session.expires = expiresValue;
        window.GLOBAL_CONFIG.config.session.init = new Date().toISOString();
      } else {
        window.GLOBAL_CONFIG.config.session.expires = 0;
      }
    }

    // Get any other cookie values
    else {
      console.log("[App] Saving value from cookie (", cookieName, "): ", cookieValue);
      try {
        window.GLOBAL_CONFIG.config.session[cookieName] = decodeURIComponent(cookieValue);  // cookie.expires
      } catch (e) {
        console.log(e);
      }
    }
  })

  console.log('window.GLOBAL_CONFIG (after cookies): ', window.GLOBAL_CONFIG);

// Token needs to be retrieved at runtime and then used to instantiate each service
  window.GLOBAL_CONFIG.config.connectionSettings = {
    // BASE: import.meta.env.VITE_HOST ?? window.location.origin,    // Is this ever going to be needed?
    BASE: window.location.origin,
    HEADERS: {'x-csrf-token': window.GLOBAL_CONFIG.token}
  };

  triggerSessionUpdate(force);

  return window.GLOBAL_CONFIG.config.connectionSettings;
}

export const triggerSessionUpdate = (force = false) => {
  if ((getSessionExp() > 0 && (!window.GLOBAL_CONFIG.config.authorization)) || force) {
    getPermissions(force)
      .then(() => {
        const event = new CustomEvent("sessionUpdated", { detail: window.GLOBAL_CONFIG.config.auth });
        console.log("[AppUtils] Session updated... triggering event, 'sessionUpdated'");
        document.dispatchEvent(event)
      })
      .catch((e) => {
        console.log(e)
      })
      .finally(() => {
        pendingPermissionRequest = null;
      });
    setExp();
  }
}

export const expireSession = () => {
  if (!isSessionActive) {
    console.log("[AppUtils] expireSession(): Session already expired... doing nothing.");
    return;
  }

  clearSessionCookies();

  if (window?.GLOBAL_CONFIG?.config?.user && window?.GLOBAL_CONFIG?.config?.session) {
    // window.GLOBAL_CONFIG.config.auth.exp = new Date() / 1000;
    window.GLOBAL_CONFIG.config.user.username = "";
    window.GLOBAL_CONFIG.config.user.id = "";
    window.GLOBAL_CONFIG.config.session.expires = 0;

    console.log('window.GLOBAL_CONFIG (after expireSession() ): ', window.GLOBAL_CONFIG);

    clearPermissions();
    clearSessionCookies();
  }

  triggerSessionUpdate(true);
}

/***************************************************
 * Clear Session Cookies
 *
 *    Clears JWT token cookies.
 *
 * NOTE: This method is only used when JWT tokens
 *    are implemented and using an expiration.
 *    By default, JWT tokens are not used.
 ***************************************************/
export const clearSessionCookies = () => {
  const cookies = document.cookie.split('; ');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const splitCookie = cookie.split('=');
    const cookieName = splitCookie[0];
    const cookieValue = splitCookie[1];

    // 1. Get jwt
    if (cookieName.toLowerCase().includes('auth')) {
      try {
        // Remove cookie
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        console.log("Removing cookie: name = ", name);
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } catch (e) {
        console.log(e);
      }
    }
  }
}

export const setExp = () => {
  if (getSessionExp() && import.meta.env.VITE_LIVEON) {
    // window.GLOBAL_CONFIG.config.auth.exp = window.GLOBAL_CONFIG.config.auth.exp + (60 * 24 * 365 * 1000);
    // document.setCookie = "AuthToken=" + jwt_encode(window.GLOBAL_CONFIG.config.auth, import.meta.env.VITE_JWT_SECRET);
  }
}

// export const hasPriv = (priv) => {
//   console.log("[secUtils] hasPriv(", priv, "): ", window.GLOBAL_CONFIG.config.authorization?.permissions);
//   const perms = window.GLOBAL_CONFIG.config.authorization?.permissions;
//
//   if (!priv || !perms?.length) {
//     return false;
//   }
//
//   for (let i = 0; i < perms.length; i++) {
//     if (perms[i] === priv) {
//       return true;
//     }
//   }
//   return false;
// }

/***********************************************
 * Submits a file.
 *
 *  Given a file field value, submits the file and
 *  returns the saved File ID.
 *
 * @param data
 * @returns {Promise<string>}: UUID used.
 ***********************************************/
const submitFile = async (data) => {
  if (!data) {
    return Promise.resolve("");
  }
  const mediaId = UUID.validate(data.id) ? data.id : UUID.v4();
  const file = data.file[0].file;
  // console.log("file name = ", file.name);

  const fileData = {
    id: mediaId,
    generatehash: true,
    source: file,
    mediatype: file.type,
    jsonData: {
      id: mediaId,
      name: file.name,
      mediaType: file.type,
      lastModified: file.lastModified,
      size: file.size
    }
  }
  // console.log("formData = ", formData.values());
  // console.log("fileData = ", fileData);
  const MediaService = new MediaAPI(getConnectionSettings()).media;
  return await MediaService.postMedia(fileData, window.GLOBAL_CONFIG?.token)
    .then((result) => {
      return result;
    })
    .catch(e => {
      console.log(e);
      return e;
    });
}

export const usingSessionExp = () => {
  return (getSessionExp() > 0);
}

export const isSessionActive = () => {
  // console.log("[AppUtils] isSessionActive(): Returning ", getNowMillisec(), " < ", getSessionExp(), " = ", getNowMillisec() < getSessionExp());
  return getNowMillisec() < getSessionExp();

  // return window.GLOBAL_CONFIG?.config?.auth?.exp > window.GLOBAL_CONFIG.config?.auth?.iat &&
    // getNowSec() < window.GLOBAL_CONFIG?.config?.auth?.exp;
}

// export const expireSession = () => {
//   if (!isSessionActive) {
//     console.log("[AppUtils] expireSession(): Session already expired... doing nothing.");
//     return;
//   }
//   window.GLOBAL_CONFIG.config.auth.exp = 0;
//   clearPermissions();
//   clearSessionCookies();
// }

export const clearPermissions = () => {
  window.GLOBAL_CONFIG.config.authorization = null;
}

// export const clearSessionCookies = () => {
//   const cookies = document.cookie.split('; ');
//   for (let i = 0; i < cookies.length; i++) {
//     const cookie = cookies[i];
//     const splitCookie = cookie.split('=');
//     const cookieName = splitCookie[0];
//     const cookieValue = splitCookie[1];
//
//     // 1. Get jwt
//     if (cookieName.toLowerCase().includes('auth')) {
//       try {
//         // Remove cookie
//         const eqPos = cookie.indexOf("=");
//         const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
//         document.cookie = name + "=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
//       } catch (e) {
//         console.log(e);
//       }
//     }
//   }
// }

// export const setExp = () => {
//   if (window.GLOBAL_CONFIG?.config?.auth?.exp && process.env.VUE_APP_LIVEON === "true") {
//     console.log("[AppUtils] LIVE_ON === ", process.env.VUE_APP_LIVEON, "... extending local session");
//     window.GLOBAL_CONFIG.config.auth.exp = window.GLOBAL_CONFIG.config.auth.exp + (60 * 24 * 365 * 1000);
//     document.setCookie = "AuthToken=" + jwt_encode(window.GLOBAL_CONFIG.config.auth, process.env.VUE_APP_JWT_SECRET);
//   }
// }

/***********************************************
 * Checks if current user has a privilege (permission)
 *
 *  Loops through the array of permissions and
 *  returns true if the provided 'priv' string
 *  exists.
 *
 *
 * @param priv
 * @returns {boolean}
 ***********************************************/
export const hasPriv = (priv) => {
  // console.log("[secUtils] hasPriv(", priv, "): ", window.GLOBAL_CONFIG.config.authorization?.permissions);
  const perms = window.GLOBAL_CONFIG.config.authorization?.permissions;

  if (!priv || !perms?.length) {
    return false;
  }

  // Put permissions into a map the fist time this is called and reference it with each additional call ( for O(1) lookups).
  if (!privMap) {
    privMap = perms.reduce((acc, val) => {  // For each permission...
      acc[val.name] = val;                  // Add it to the map and return the new map value for the next iteration.
      return acc;
    }, {});
  }

  return !!privMap[priv];
}

/***********************************************
 * Has role for active client.
 *
 *   True if the provided role (case-insensitive) is
 *   equal to a client role. The 'forAnyClient' argument
 *   can be set to TRUE to search through each role associated
 *   with the user. Otherwise ('forAnyClient' = FALSE [Default]),
 *   Only check against the currently active client role.
 *
 *   A special comparison of the 'is_worker' flag is
 *   used for the "Worker" role.
 *
 * @param role {string}: The case-insensitive role to check for (i.e. 'Admin', 'worker')
 * @param forAnyClient {boolean}: TRUE = Find matching role within any client. FALSE = Only check actively current client
 * @returns {boolean}: TRUE = Has role with active client.
 ***********************************************/
export const hasRole = (role = "Default", forAnyClient = false) => {
  // console.log("[secUtils] hasRole(", role, "): ", window.GLOBAL_CONFIG.config.authorization);

  if (forAnyClient) {
    // Loop through each role to find a match
    const roles = getClientRoles();
    const roleClientIds = Object.keys(roles);
    // Loop through roles
    for (let i = 0; i < roleClientIds.length; i++) {
      const clientRole = getClientRole(roleClientIds[i]);
      if (role.toLowerCase() === "worker") { // Worker role check
        if (clientRole.is_worker) {
          return true;
        }
      } else {
        if (role.toLowerCase() === clientRole.role?.toLowerCase()) {  // Any other role
          return true;
        }
      }
    }
    return false;
  }

  // Check only the currently active role (!forAnyClient)
  let activeRole = getClientRole();
  if (role.toLowerCase() === "worker") {
    return activeRole.is_worker;
  }

  return role.toLowerCase() === activeRole?.role?.toLowerCase();
}

export class Countdown {
  timer;
  seconds;
  updateStatus;
  counterEnd;
  intervalFreq;
  intervalLength;

  constructor(options = {}) {
    this.seconds = options.seconds || 13;
    this.updateStatus = options.onUpdateStatus || function () { };
    this.counterEnd = options.onCounterEnd || function () { };
    this.intervalFreq = options.intervalFreq || 1000;
    this.intervalLength = this.seconds;
  }

  decrementCounter = () => {
    this.updateStatus(this.seconds);
    if (this.seconds <= 0) {
      this.counterEnd();
      this.stop();
    }
    this.seconds--;
  }

  start = () => {
    clearInterval(this.timer);
    this.timer = 0;
    this.seconds = this.intervalLength;
    this.timer = setInterval(this.decrementCounter, this.intervalFreq);
  };

  stop = () => {
    clearInterval(this.timer);
  };
}

export const getSessionExp = () => {
  return new Date(window.GLOBAL_CONFIG.config?.session?.expires).valueOf() || 0;
  // return window.GLOBAL_CONFIG.config?.auth?.exp || 0;
}

export const getSessionExpSeconds = () => {
  return Math.floor(getSessionExp() / 1000);
  // return window.GLOBAL_CONFIG.config?.auth?.exp || 0;
}

export const getSessionInit = () => {
  return window.GLOBAL_CONFIG.config?.session?.init
    ? new Date(window.GLOBAL_CONFIG.config.session.init).valueOf()
    : 0;
}

export const getNowSec = () => {
  return Math.floor(getNowMillisec() / 1000);
}

export const getNowMillisec = () => {
  return Date.now().valueOf();
}

const units = [
  'year',
  'month',
  'week',
  'day',
  'hour',
  'minute',
  'second',
];

/************************************************
 * Retrieve date from JS Date
 *
 * @returns {string}
 ************************************************/
export const getPostedTimeAgo = (date) => {
  const prefix = 'Posted ';
  if (!date) {
    return prefix;
  }
  let dateTime = DateTime.fromJSDate(new Date(date))

  const diff = dateTime.diffNow().shiftTo(...units);
  const unit = units.find((unit) => diff.get(unit) !== 0) || 'second';

  const relativeFormatter = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
  });
  return prefix + relativeFormatter.format(Math.trunc(diff.as(unit)), unit);
}

/************************************************
 * Is current user auth token valid?
 *
 * @returns {boolean}
 ************************************************/
export const isAuthenticated = () => {
  const expires = getSessionExp();
  const username = window.GLOBAL_CONFIG.config?.user?.username;

  // Handle sessions with expirations
  if (expires !== null && expires > 0) {
    return (expires > new Date().valueOf());
  }

  // Otherwise, session does not have an expiration, just check for username (which originated from session)
  return (typeof username === "string" && username !== "" && username !== "anonymous");

  // return window.GLOBAL_CONFIG.config?.auth?.exp > getNowSec();
}

/************************************************
 * Clear/expire auth session.
 *
 * @returns {boolean}
 ************************************************/
export const clearAuth = () => {
  expireSession();
}

export const getUserId = () => {
  return window["GLOBAL_CONFIG"]?.config?.auth?.sub || 0;
}

export const getUserName = () => {
  return window["GLOBAL_CONFIG"]?.config?.user?.name
    || window["GLOBAL_CONFIG"]?.config?.user?.username
    || "Anon";
}

export const getToken = () => {
  return window['GLOBAL_CONFIG']?.token
    || window['GLOBAL_CONFIG']?.session['_csrf']    // I don't think this is needed anymore.
    || 'Tokemon'; // For dev
}

/*******************************************
 * Get active client id
 *
 *   Retrieves the active client id from the following
 *   in order of priority:
 *   1. Browser tab (session) storage
 *   2. Session cookie (auth.rti.default_client_id)
 *   3. Default: 1 (RTI)
 *
 * @returns {string|*|number}
 *******************************************/
export const getClientId = () => {
  const key = `activeClientId-${getUserId()}`;
  const activeSessionClientId = sessionStorage.getItem(key);

  if (getClientRole(activeSessionClientId)) {
    return activeSessionClientId;
  }

  return window.GLOBAL_CONFIG?.config?.user?.default_client_id || 1;
}

/*******************************************
 * Set active client id
 *
 *   Records the selected client id in browser tab
 *   (session) storage then optionally refreshes
 *   connection settings.
 *
 * @param clientId {number | string}: [OPTIONAL] The client id to set active for this browser tab session (default = Current client id from tab session, otherwise server session)
 * @param refreshConnectionSettings {boolean}: [OPTIONAL] Refresh session token and permissions (default = FALSE)
 *******************************************/
export const setActiveClientId = (clientId = getClientId(), refreshConnectionSettings = true) => {
  if (typeof clientId === "number") {
    clientId = clientId.toString(10);
  }

  const key = `activeClientId-${getUserId()}`;
  const prevClientId = sessionStorage.getItem(key);
  let sessionChanged = prevClientId && prevClientId !== clientId;

  sessionStorage.setItem(key, clientId);

  // If active client already set in session, don't bother forcing a refresh.
  if (refreshConnectionSettings || sessionChanged) {
    getConnectionSettings(true);
  }
}

export const getClientRoles = () => {
  return window.GLOBAL_CONFIG?.config?.user?.roles || {};
}

export const getClientRole = (clientId = getClientId()) => {
  const role = getClientRoles()[clientId];
  if (!role) {
    return "";
  }
  return { id: clientId, name: `${role.client_name} (${role.role})`, role: role.role, is_worker: role.is_worker };
}

export const getClientRolesList = () => {
  const roles = getClientRoles();

  return Object.keys(roles).map((key) => {
    return getClientRole(key)
  });
}

export const getRoleName = () => {
  return getClientRoles()[parseInt(getClientId())]?.role || 'Default';
}

/******************************************
 * Get errors from response.
 *
 *  Given an error response object, constructs
 *  a string error message that can be displayed.
 *
 *
 * @param response
 ******************************************/
export const getErrors = (response) => {
  if (!response?.body) {
    return "";
  }
  if (!response?.body?.errors) {
    return JSON.stringify(response);
  }

  const del = "  "
  let errorMsg = "";
  const errors = response.body.errors;

  if (Array.isArray(response.body.name)) {
    errorMsg += errors.name?.join(" ") || "";
  } else {
    errorMsg += `${response.body.name}: ${response.body.description || ""} \n`;   // Error set name (i.e. "Bad Request")
  }

  Object.keys(errors).forEach((errorName) => {
    // console.log("Joining errors for sub-property: ", errorName, errors[errorName]);
    if (typeof errors[errorName] === "object") {    // Support for errors within sub-property objects
      errorMsg += getErrors({ body: { name: errorName, errors: errors[errorName] } })
    } else if (typeof errors[errorName] === "string") {
      errorMsg += errors[errorName] + " ";
    } else {
      if (errors.hasOwnProperty(errorName)) {
        errorMsg += `'${errorName}': ${errors[errorName]?.join(" ") || ""}${del} \n`;
      }
    }
  })

  return errorMsg;
}

/********************************************
 * Converts an object to an index string.
 *
 *  Given an object, string, number or array, will recursively
 *  go through each property and sub-property to build a
 *  single string index of the values. The result is comma-delimited
 *  string that can be searched for a specific set of characters.
 *
 * @param obj
 * @returns {{}|string}
 ********************************************/
export const toIndex = (obj = {}) => {
  // console.log("createObjectIndex(", obj, ")");

  // null, undefined
  if (!obj) {
    return "";
  }

  // string
  if (typeof obj === 'string') {
    return obj;
  }

  const indexArray = [];
  // Array
  if (Array.isArray(obj)) {
    obj.forEach((val) => {
      indexArray.push(toIndex(val));
    })
    if (indexArray.length <= 0) {
      return "";
    }
  }

  // Object
  Object.keys(obj).forEach((key) => {
    if (obj.hasOwnProperty(key) && obj[key]) {
      if (typeof obj[key] === 'object' || Array.isArray(obj[key])) {
        indexArray.push(toIndex(obj[key]));
      } else if (typeof obj[key] !== "string") {
        indexArray.push(obj[key].toString());
      } else if (typeof obj[key]) {
        indexArray.push(obj[key]);
      } // else null/undefined
    }
  })

  return indexArray.toString();
}

export const isDevMode = () => {
  return process.env.VUE_APP_DEVMODE === "true";
}

export const getClientRoleTitle = (clientId = getClientId()) => {
  if (!getClientRoles()) {
    return DEFAULT_ROLE_TITLE;
  }

  const role = getClientRoles()[clientId];

  if (!role) {
    console.log("[AppUtils] getClientRoleTitle(", clientId, "): WARNING - User does not appear to have role with clientId (", clientId, ")");
    return DEFAULT_ROLE_TITLE;
  }

  return `${role.client_name} (${role.role})`;
}

export const getUserTitle = () => {
  return getClientRoleTitle(getClientId());
}

export const getActiveClientRole = () => {
  if (!window.GLOBAL_CONFIG?.config?.user?.roles) {
    return "Reach Talent, Inc."
  }

  return { id: getClientId(), name: window.GLOBAL_CONFIG?.config?.user?.roles[getClientId()] }
}

export const getUserEmail = () => {
  if (!window.GLOBAL_CONFIG?.config?.user?.roles) {
    return "Reach Talent, Inc."
  }

  return { id: getClientId(), name: window.GLOBAL_CONFIG?.config?.user?.roles[getClientId()] }
}

export const getUserProfileImg = (email = getUserEmail()) => {
  let result = "/img/sampleProfilePic2.png";
  try {
    result = gravatar.url(email) || result;
  } catch (e) {
    console.log("[AppUtils] getUserProfileImg(", email, "): ERROR - Unable to retrieve gravatar img src... ", e);
  }
  return result;
}

/*************************************************
 * Get Title
 *
 *   Derives a single string value from a nested object
 *   given the following:
 *    - The object with nested properties
 *    - A string representing the dot-notation path of the title property
 *
 *    For example, the title of a Worker object is the user's name: *
 *      - Object: {id, user: {id, name: "Homie DaClown"}}
 *      - Prefix: "Worker"
 *      - Title path: 'user.name'
 *      - Result: "Worker: Homie DaClown" (or just "Worker" if valid title property was not found).
 *
 *
 * @param itemValue {object}: The object with nested properties to get the title from.
 * @param prefix {string}: A prefix string to include in the result.
 * @param titleProp {string}: The dot-notation path of the property to use as the postfix.
 * @returns {*|string} prefix + derived title
 *************************************************/
export const getTitle = (itemValue = {}, prefix = "name", titleProp = "name") => {
  if (!itemValue || !titleProp) {
    return prefix;
  }

  let postfix = itemValue[titleProp] || "";

  // Support for dot-notation in title props (looking at you Worker.USER.name and Requisition.POSITION.title)
  if (titleProp.includes('.') || typeof itemValue[titleProp] === "object") {
    const subProps = titleProp.split('.'); // dot-notation string converted into individual property names
    let nextObj = { ...itemValue };    // The sub-property to be stepped through in the next pass

    for (let i = 0; i < subProps.length; i++) {
      if (!nextObj) {
        postfix = "";
        break;
      }
      const prop = subProps[i];
      if (typeof nextObj[prop] === "string") {
        postfix = nextObj[prop];      // We have a string, can't go any further... just return it.
        break;
      }
      if (typeof nextObj[prop] === "object") {
        nextObj = nextObj[prop];

        if (i === subProps.length - 1) {
          // End of the dot-notation path and we still have an object instead of the expected string...
          postfix = JSON.stringify(nextObj);  // so use a stringified version of the object.
        }
      }
    }
  }

  if (!postfix) {
    return prefix;
  }

  return `${prefix ? prefix + ': ' : ''} ${postfix}`;
}

export const getItemByValue = (val, itemsList, valProp = "id") => {
  for (let i = 0; i < itemsList.length; i++) {
    if (itemsList[i][valProp] === val) {
      return itemsList[i];
    }
  }
}

/*********************************************************
 * Get selected items.
 *
 *   Convenience function for the ObjectList model.
 *   Since DataTable only gives us a single property (i.e. id)
 *   for selected rows, this function can use that 'selected'
 *   value from the model and iterate through the 'itemsList'
 *   to return an array with the associated, selected objects.
 *
 *   To reduce complexity, further refinement can be achieved
 *   during processing by using the 'filterFunction', which is
 *   a reference to a function that takes in a single object and
 *   returns TRUE (keep) or FALSE (filter out). It will be called
 *   for each selected object.
 *
 * @param selected {number[] | null}: List of identifiers to find the objects for. NULL = Return each item (after filter, if provided)
 * @param itemsList {object[]}: List of objects to search through.
 * @param valProp {string}: The property in each object to use for comparison (i.e. 'id).
 * @param filterFunction {?function}: [OPTIONAL] Reference to a filter function to further refine the returned list.
 * @returns {object[]}: The selected item objects.
 *********************************************************/
export const getSelectedItems = (selected = [], itemsList = [], valProp = 'id', filterFunction) => {
  const filter = typeof filterFunction === "function";
  const selectedItems = [];
  const filterResults = [];

  // A 'selected' list was not provided, apply the filter to each item.
  if (selected === null && filter) {
    itemsList.forEach((item) => {
      if (filterFunction(item)) {
        filterResults.push(item);
      }
    })
  }

  if (selected?.length > 0) {
    selected.forEach((selection) => {
      // Get selected item
      const item = getItemByValue(selection, itemsList, valProp);
      selectedItems.push(item);
      if (filter) {
        if (filterFunction(item)) {
          filterResults.push(item);
        }
      }
    })
  }
  return filter ? filterResults : selectedItems;
}

/*****************************************************
 * Clone an Object
 *
 *    Returns a "deep" clone of an object. This includes
 *    any sub-properties of the following types:
 *      - Simple (number, string, boolean)
 *      - Objects and arrays
 *      - Functions
 *      - Dates
 *      - Classes (incl constructors)
 *
 * @param item {*}: The object to clone.
 * @returns {*}: The cloned object (not a reference).
 *****************************************************/
export const clone = (item) => {
  if (!item) { return item; } // null, undefined values check

  const types = [Number, String, Boolean];
  let result;

  // normalizing primitives if someone did new String('aaa'), or new Number('444');
  types.forEach(function (type) {
    if (item instanceof type) {
      result = type(item);
    }
  });

  if (typeof result === "undefined") {
    if (Object.prototype.toString.call(item) === "[object Array]") {
      result = [];
      item.forEach(function (child, index, array) {
        result[index] = clone(child);
      });
    } else if (typeof item === "object") {
      // testing that this is DOM
      if (item.nodeType && typeof item.cloneNode === "function") {
        result = item.cloneNode(true);
      } else if (!item.prototype) { // check that this is a literal
        if (item instanceof Date) {
          result = new Date(item);
        } else {
          // it is an object literal
          result = {};
          for (let i in item) {
            result[i] = clone(item[i]);
          }
        }
      } else {
        // depending on what you would like here,
        // just keep the reference, or create new object
        if (item.constructor) {
          // would not advise to do that, reason? Read below
          result = new item.constructor();
        } else {
          result = item;
        }
      }
    } else {
      result = item;
    }
  }

  return result;
}

/****************************************************************************
 * Get query string
 *
 *    Given the query object from 'this.$route.query', will return a string
 *    format with the 'path' and 'token' parameters.
 *
 * @param query {object}: From 'this.$route.query'
 * @returns {string}: The query string in string format (?path="xyz"&invite_token="abc")
 ****************************************************************************/
export const getQueryString = (query = {}) => {
  let qs = "";

  // Otherwise, build the query string.
  qs = "?";
  if (query.path) {    // If a path is provided, include it.
    qs += `next_url=${query.path}`;
  }
  if (query.token || query.path?.includes("token")) {    // If a token is provided, include it.
    if (qs.includes('=')) qs += '&';    // If we added a previous param, include the '&' to separate this one.
    const token = query.token || query.path?.toString().split("token=")[1].split("&")[0];
    qs += `invite_token=${token}`;
  }
  return qs === "?" ? "" : qs;
}
