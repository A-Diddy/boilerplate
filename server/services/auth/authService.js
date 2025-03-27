'use strict';
const knexInstance = require("../../db/knexInstance");
const logger = require("../../utils/logger.js");
const fs = require('fs');
const IoService = require("../io/ioService");
const configPath = "./server/config";
const configFile = configPath + "/config.json";
const UUID = require('uuid');
const {insertUpdate, verifyRequiredFields} = require("../../utils/systemUtils");

const USERS_TABLE = "users";
const FED_CRED_TABLE = "federated_credentials";
const TOKENS_TABLE = "tokens";
const PASSWORD_ENTITY = "password";
const GOOGLE_PROFILE_TYPE = "GOOGLE";
const APPLE_PROFILE_TYPE = "APPLE";
const TWITTER_PROFILE_TYPE = "TWITTER";
const LINKEDIN_PROFILE_TYPE = "https://linkedin.com";
const FB_PROFILE_TYPE = "CUCKBOOK";
const DEFAULT = "default";


// This config Externalized in /server/config/config.json
let config = {};
// {
//   io: {
//     get: {
//       users: {
//         isAuthenticated: true,    // and...
//         hasPriv: "read",          // or...
//         hasRole: "sysadmin",
//         isCreator: true,
//         isOwner: true,
//         ruleFunc: (obj) => {return false}
//       },
//       profiles: {
//         isAuthenticated: true,    // and...
//         hasPriv: "read",          // or...
//         hasRole: "sysadmin",
//         isCreator: true,
//         isOwner: true,
//         ruleFunc: (obj) => {return false}
//       }
//     },
//     post: {
//       users: {
//         isAuthenticated: true,    // and...
//         hasPriv: "write",          // or...
//         hasRole: "sysadmin",
//         isCreator: true,
//         isOwner: true,
//         ruleFunc: (obj) => {return false}
//       },
//       profiles: {
//         isAuthenticated: true,    // and...
//         hasPriv: "write",          // or...
//         hasRole: "sysadmin",
//         isCreator: true,
//         isOwner: true,
//         ruleFunc: (obj) => {return false}
//       }
//     }
//   }
// }

// //////////////////////////////////////////////////////////////////////////////////

function loadConfig() {
  try {
    const data = fs.readFileSync(configFile, 'utf-8');
    config = JSON.parse(data);
    console.log('Config loaded:', config);
  } catch (error) {
    console.error('Error loading config:', error);
  }
  config = config || {};
}

function watchConfig() {
  fs.watchFile(configFile, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log('Config file changed. Reloading...');
      loadConfig();
    }
  });
}

loadConfig();
watchConfig();

// Access configuration values
function getConfig(key) {
  return config[key];
}

// Example usage
// console.log(getConfig('database'));



// //////////////////////////////////////////////////////////////////////////////////

/****************************************************
 * Verify new user record.
 *
 *  Check for duplicate username or email.
 *
 ****************************************************/
exports.newUserValidation = (req, res, next) => {
  // console.log("newUserValidation(", req.body, ")");
  // TODO: Validate email address and username format

  // Validate email address and username uniqueness
  knexInstance(USERS_TABLE)
    .select('*')
    .where({"username": req.body.username})
    .orWhere({"email": req.body.email})
    .then((results) => {
      console.log("found matching records = ", results.length);
      if (results.length > 0) {
        const result = results[0];
        let msg = "";
        let msgs = [];
        let errCnt = 0;

        if (result.username === req.body.username) {
          msg += 'Username already exists. Please select another username.'
          res.locals.messages.push({username: "Username already exists"});
          errCnt++;
        }
        if (result.email === req.body.email) {
          msg += 'Email address already exists. Please select another email address or try to <a href="/login">log in</a>.'
          res.locals.messages.push({email: "Email already exists"});
          errCnt++;
        }

        if (errCnt >= 2) {
          msg += 'Need to reset your password?'
        }
        console.log(msg);
        return next();
        // return res.send(msg);
      }
      next();
    });
}

// //////////////////////////////////////////////////////////////////////////////////

/**********************************************************************
 * Does the user have the privilege to access the route/method/index?
 *
 * Returns a function to be used as middleware. Optionally accepts an index-level
 * auth config parameter for the route it's being used on. Otherwise, attempts
 * to use the route/method/index auth config from config.json.
 *
 * NOTE: When using this function as middleware, remember to execute it
 * so the actual middleware function is returned. For example...
 *
 * YES -> `AuthService.hasPriv()`  // Returns the middleware function
 * NO  -> `AuthService.hasPriv`    // Does nothing
 *
 *
 * @param configInput {object} [OPTIONAL] The method-level auth config to apply (needs
 * to specify rules for each index type). Overwrites any route/method/index
 * configured auth rules in `config.json`.
 *
 * @returns {function(*, *, *): Promise<*>}
 **********************************************************************/
exports.hasPriv = (configInput = undefined) => {
  return async (req, res, next) => {
    let service = req.baseUrl?.replace("/", ""); // req.path;
    let method = req.method.toLowerCase();
    let index = req.params?.index || req.query?.index;
    let id = req.params.id || req.query.id;
    const user = req.user;
    const userId = req.user?.id;
    const sessionPrivs = req.user?.auth;

    console.log("[authUtils] hasPriv(",configInput,"): ", {service, method, index, id, userId, user});

    // TODO: Add getUserPermissions() to the user session so it's only called once when logging in.
    // Get auth permissions from session or fetch them if not found.
    // Fetching them should never be needed in prod... this is just for testing and as a backup.
    console.log("[AuthService] hasPriv(): sessionPrivs = ", sessionPrivs);
    const userPrivs = sessionPrivs || await exports.getUserPermissions(userId);

    let localConfig = {};

    // 'default' config is used when a specific config is not provided...
    if (configInput && typeof configInput === "object") {
      console.log("!! USING CONFIG INPUT !!... ", configInput);
      // Use 'default' config if specific config for current index is not provided
      if (!configInput[index]) {
        index = DEFAULT;
      }
      localConfig = configInput[index];
    } else {
      // Use 'default' service, method and index if specific config is not provided
      if (!config[service]) {
        service = DEFAULT;
      }
      if (!config[service]?.[method]) {
        method = DEFAULT;
      }
      if (!config[service]?.[method]?.[index]) {
        index = DEFAULT;
      }
      try {
        localConfig = config?.[service]?.[method]?.[index];
      } catch (e) {
        logger.info(`[AuthService] hasPriv(): No config available for ${service, method, index}... ${e}`);
      }
    }

    console.log(`[authUtils] hasPriv(): Using local config (${service}.${method}.${index})... ${JSON.stringify(localConfig)}`);

    // TODO: Handle no config for service, method or index and no 'default'...
    if (!localConfig) {
      console.log("[authUtils] hasPriv(): Config not found for ", {service, method})
      // Auth config not found for this route.
      if (process.env.ALLOW_ACCESS_BY_DEFAULT === "true") {
        return next();
      } else {
        const msgCode = "FORBIDDEN";
        const msg = "Authorization configuration not found and access is whitelisted. Please add auth config to allow access or change 'ALLOW_ACCESS_BY_DEFAULT' to be 'true'";
        logger.info("[AuthService] hasPriv(", index, ", ", id, "): ", msgCode, " - ", msg, "... exiting");
        const errorResponse = {
          status: 403,
          msgCode: msgCode,
          message: msg
        };
        res.status(403);
        return res.send(errorResponse);
      }
    }

    let privCount = 0; // 0 = no privilege.

    if (localConfig?.isAuthenticated) {
      if (!userId) {
        // RETURN ERROR: NOT AUTHENTICATED
        const msgCode = "FORBIDDEN";
        const msg = "You must be logged in to perform this action.";
        console.log("[AuthService] hasPriv(", index, ", ", id, "): ", msgCode, " - ", msg, "... exiting");
        const errorResponse = {
          status: 403,
          msgCode: msgCode,
          message: msg
        };
        res.status(403);
        res.send(errorResponse);
        return;
      } else if (Object.keys(localConfig).length === 1) {
        // User is authenticated and no other rules exist
        return next();
      }
    }
    // TODO: When no other privileges are configured, should access be granted with just authentication?

    // The remaining privilege checks are evaluated as ORs... if anyone of them is true, allow access.

    if (localConfig.hasPriv
      && (userPrivs.permissions?.[index]?.[localConfig.hasPriv]
        // if user has 'write' priv but only 'read' is required...
        || localConfig.hasPriv === "read" && userPrivs.permissions?.[index]?.["write"])) {
        // HAS PRIVILEGE
        privCount++;
    }

    // --

    if (localConfig.hasRole) {
      // Support for array of roles or single role string
      // if string type, put it into array
      if (typeof localConfig.hasRole === 'string') {
        localConfig.hasRole = [localConfig.hasRole];
      }

      if (localConfig.hasRole.length > 0) {
        for (let i = 0; i < localConfig.hasRole?.length;  i++) {
          if (userPrivs.roles?.[localConfig.hasRole[i]]) {
            privCount++;
            break;    // We found a matching role, just move on.
          }
        }
      }   // else (not array), do nothing
    }

    // --

    if (privCount <= 0  // Don't bother fetching record if they already have the privilege
      && (localConfig.isCreator || localConfig.isOwner || localConfig.ruleFunc)) {  // Only these checks get the record.
      const record = await IoService.getMetaById(id, index);
      // console.log("got meta for record: ", record);

      if (localConfig.isCreator && record.created_by === userId) {
        // IS CREATOR
        privCount++;
      }

      if (localConfig.isOwner && record.owned_by === userId) {
        // IS OWNER
        privCount++;
      }

      // --

      // TODO: Find a way to isolate/contain execution of the custom function or remove it
      //  Currently, the function has unlimited access to do anything it wants on the server
      if (typeof localConfig.ruleFunc !== "undefined" && localConfig.ruleFunc(record)) {
        // CUSTOM RULE FUNCTION
        try {
          if (localConfig.ruleFunc(record, user)) {
            privCount++;
          }
        } catch (e) {
          logger.info("[AuthService] hasPriv(): Custom rule function returned error... ", e);
        }
      }
    }
    // ......................................................

    if (privCount <= 0) {
      // NO PRIVILEGES
      const msgCode = "FORBIDDEN";
      const msg = "You do not have sufficient privileges to perform this action.";
      console.log("[AuthService] hasPriv(", index, ", ", id, "): ", msgCode, " - ", msg, "... exiting");
      const errorResponse = {
        status: 403,
        msgCode: msgCode,
        message: msg
      };
      res.status(403);
      return res.send(errorResponse);
    }
    return next();
  }
}

exports.insertUpdateRole = (dataIn, created_by = "system") => {
  // Error handling
  if (dataIn.userId && !dataIn.user_id) {dataIn.user_id = dataIn.userId}
  const {result, msg} = verifyRequiredFields(dataIn, ['role', 'user_id']);
  if (!result) {
    logger.info("[AuthService] insertUpdatePermission(): ", msg);
    return Promise.reject(msg);
  }

  // Format data
  const data = {
    id: dataIn?.id || UUID.v4(),
    index: dataIn.index || "system",
    user_id: dataIn.user_id,
    role: dataIn.role,
    json_data: {},
    created_by: created_by,
    owned_by: created_by
  }

 return insertUpdate(data, 'roles');
}

/*************************************************************
 *
 * @param dataIn
 * @param created_by
 * @returns {*|Promise<T>}
 */
exports.insertUpdatePermission = (dataIn, created_by = "system") => {
  // Error handling
  const {result, msg} = verifyRequiredFields(dataIn, ['role', 'permission', 'index']);
  if (!result) {
    logger.info("[AuthService] insertUpdatePermission(): ", msg);
    return Promise.reject(msg);
  }

  // Data formatting
  const data = {
    id: dataIn?.id || UUID.v4(),
    index: dataIn.index,
    user_id: dataIn.user_id || dataIn.userId || null,
    role: dataIn.role,
    permission: dataIn.permission,
    json_data: dataIn.json_data,
    created_by: created_by,
    owned_by: created_by
  }

  return insertUpdate(data, 'permissions');
}

exports.getRolePermissions = (role) => {
  const index = 'permissions';
  const data = {
    role: role
  }

  const result = {}

  return knexInstance(index)
    .where(data)
    .select("index", "permission")
    .groupBy('index', 'permission')
    .then(async (results) => {
      logger.info(`getRolePermissions(${role}): results: ${JSON.stringify(results)}`);
      // Format data
      results.forEach((row) => {
        result[row.index] = result[row.index] || {};
        result[row.index][row.permission] = true;
      })

      return result;
    });
}

exports.getUserRoles = (userId) => {
  const index = 'roles';
  const data = {
    user_id: userId
  }

  const result = {}

  return knexInstance(index)
    .where(data)
    .select("index", "role")
    .groupBy('index', 'role')
    .then(async (results) => {
      logger.info(`getUserRoles(${userId}): results: ${JSON.stringify(results)}`);
      // Format data
      results.forEach((row) => {
        // result[row.index] = result[row.index] || {};
        // result[row.index][row.role] = true;
        result[row.role] = true;
      })

      return result;
    });
}

/***********************************************************
 * Get user permissions
 *
 * Gets user permissions object for a specific user or, if a
 * user is not provided, gets entire set of
 * roles/index/permissions ( used by getExistingRoles() ).
 *
 * @param userId
 * @returns {Promise<{permissions: {}, roles: {}, rolePermissions: {}}>}
 ***********************************************************/
exports.getUserPermissions = (userId) => {
  // Get user roles joined with permissions
  console.log("[AuthService] getUserPermissions(",userId,")");
  const index = 'roles';

  const result = {
    permissions: {},
    roles: {},
    rolePermissions: {}
  }

  return knexInstance(index)
    .where((builder) => {
      if (typeof userId === 'string' && userId !== '') {
        builder.where('roles.user_id', userId)
      }
      return builder;
    })
    .select("roles.role", "permissions.index", 'permissions.permission')
    .groupBy('roles.role', 'permissions.index', 'permissions.permission')
    // .join('permissions', 'users.id', 'contacts.user_id')
    .leftJoin('permissions', 'roles.role', '=', 'permissions.role')
    .then(async (results) => {
      logger.info(`getUserRoles(${userId}): results: ${JSON.stringify(results)}`);
      // Format data
      results.forEach((row) => {
        result.roles[row.role] = true;

        if (row.index !== null && row.index !== "null") {
          result.rolePermissions[row.role] = result.rolePermissions[row.role] || {};
          result.rolePermissions[row.role][row.index] = result.rolePermissions[row.role][row.index] || {};
          result.rolePermissions[row.role][row.index][row.permission] = true;

          result.permissions[row.index] = result[row.index] || {};
          result.permissions[row.index][row.permission] = true;
        }
      })

      return result;
    });
}

exports.getExistingRoles = (userId) => {
  return exports.getUserPermissions(userId).then((results) => {
    delete results.permissions;
    return results;
  })
}


// TODO: Create functions for each auth operation (in auth.yaml). Then move functions from authRouter.js to here.
// TODO: Goal: authRouter.js should only have the routing logic, not the service logic.

// TODO
exports.login = function(username, password) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

// TODO
exports.signup = function(email, username, password) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}



