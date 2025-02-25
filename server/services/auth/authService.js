'use strict';
const knexInstance = require("../../db/knexInstance");
const logger = require("../../utils/logger.js");
const fs = require('fs');
const IoService = require("../io/ioService");
const configPath = "./server/config";
const configFile = configPath + "/config.json";
const UUID = require('uuid');
const {insertUpdate, verifyRequiredFields} = require("../../utils/systemUtils");

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

exports.hasPriv = async (req, res, next) => {
  let service = req.baseUrl?.replace("/", "").toLowerCase(); // req.path;
  let method = req.method.toLowerCase();
  let index = req.params.index || req.query.index;
  let id = req.params.id || req.query.id;
  const userId = req.user?.id;
  const user = req.user;

  console.log("[authUtils] hasPriv(): ", {service, method, index, id, userId, user});

  // TODO: Get user auth privileges (from session, once their available)
  let userAuth = {
    auth: {
      permissions: {
        users: {
          // read: true,
        }
      },
      roles: {
        sysadmin: false,
        user: true
      }
    }
  }

  let localConfig = config[service][method][index];
  console.log("[authUtils] hasPriv(): Using local config... ", localConfig);

  if (!localConfig) {
    console.log("[authUtils] hasPriv(): Config not found for ", {service, method})
    // Auth config not found for this route.
    // TODO: Blacklist or whitelist????

    // return res.send({status: 403, msgCode: "FORBIDDEN"}});
    //  ... or ...
    // next();
  }

  let privCount = 0; // 0 = no privilege.

  if (localConfig.isAuthenticated && !userId) {
    // RETURN ERROR: NOT AUTHENTICATED
    const msgCode = "FORBIDDEN";
    const msg = "You must be logged in to perform this action.";
    console.log("[ioRouter] hasPriv(", index, ", ", id, "): ", msgCode, " - ", msg, "... exiting");
    const errorResponse = {
      status: 403,
      msgCode: msgCode,
      message: msg
    };
    res.status(403);
    res.send(errorResponse);
    return;
  }

  // TODO: When no other privileges are configured, should access be granted with just authentication?

  // These should all be grouped as ORs..................
  if (localConfig.hasPriv && userAuth.auth.permissions?.[index]?.[localConfig.hasPriv]) {
    // HAS PRIVILEGE
    privCount++;
  }

  if (localConfig.hasRole && userAuth.auth.roles?.[localConfig.hasRole]) {
    // HAS ROLE
    privCount++;
  }

  if (localConfig.isCreator || localConfig.isOwner) {
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
  }

  // TODO: Test ruleFunc()
  if (typeof localConfig.ruleFunc !== "undefined" && localConfig.ruleFunc(record)) {
    // CUSTOM RULE FUNCTION
    privCount++;
  }
  // ......................................................

  if (privCount <= 0) {
    // NO PRIVILEGES
    const msgCode = "FORBIDDEN";
    const msg = "You do not have sufficient privileges to perform this action.";
    console.log("[ioRouter] hasPriv(", index, ", ", id, "): ", msgCode, " - ", msg, "... exiting");
    const errorResponse = {
      status: 403,
      msgCode: msgCode,
      message: msg
    };
    res.status(403);
    res.send(errorResponse);
    return;
  }
  next();
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

exports.getUserPermissions = (userId) => {
  // Get user roles joined with permissions

  if (!userId) {
    return Promise.reject("`Missing required field: userId`");
  }

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

exports.getExistingRoles = () => {
  return exports.getUserPermissions().then((results) => {
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



