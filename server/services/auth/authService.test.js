const knexInstance = require("../../db/knexInstance");
const AuthService = require("./authService.js");
const IOService = require("../io/ioService.js");
const UUID = require('uuid');
// const describe = require("jest");

const userId = '4e161226-80fc-40fd-b1e7-f97f6774d8bc';
const userId2 = '4e161226-80fc-40fd-b1e7-f97f6774d8bb';

function getRandomCharacter() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomIndex = Math.floor(Math.random() * characters.length);
  return characters.charAt(randomIndex);
}

const newUserChar = getRandomCharacter();

const newUser = {
  username: newUserChar,
  email: newUserChar + "@stusys.com",
  password: newUserChar
}

const newId = UUID.v4();

// -------------------------------------------------------------------------------------------
// SAMPLE REQUEST, RESPONSE AND NEXT()
//
const req = {
  baseUrl: '/io',
  method: 'get',
  params: {index: 'profiles', id: newId},
  query: {index: 'profiles', id: newId},
  user: {
    id: userId,
    auth: {
      "permissions": {"profiles": {"write": true}, "users": {"read": true}},
      "roles": {"sysadmin": true, "user": true},
      "rolePermissions": {
        "sysadmin": {"profiles": {"read": true, "write": true}, "users": {"read": true}},
        "user": {"users": {"read": true}}
      }
    }
  }
}

const authReq = {
  baseUrl: '/auth',
  method: 'get',
  params: {index: 'profiles', id: newId},
  query: {index: 'profiles', id: newId},
  user: {
    id: userId,
    auth: {
      "permissions": {"users": {"read": true}, "default": {"specialPriv": true}},
      "roles": {"user": true, "specialRole": true},
      "rolePermissions": {
        "user": {"users": {"read": true}}
      }
    }
  }
}

const res = {
  status: (statusCode) => {
    return statusCode
  },
  send: (msg) => {
    return msg
  }
};

const expectedResult = "next() called"

const next = () => {
  return expectedResult
};
// -------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------
// SAMPLE CONFIG
//
const sampleConfig = {
  "io": {
    "get": {
      "users": {
        "isAuthenticated": true,
        "hasPriv": "read",
        "hasRole": "sysadmin",
        "isCreator": true,
        "isOwner": true
      },
      "profiles": {
        "isAuthenticated": true,
        "hasPriv": "write",
        "hasRole": "sysadmin",
        "isCreator": true,
        "isOwner": true
      }
    },
    "post": {
      "users": {
        "isAuthenticated": true,
        "hasPriv": "write",
        "hasRole": "sysadmin",
        "isCreator": true,
        "isOwner": true
      },
      "profiles": {
        "isAuthenticated": true,
        "hasPriv": "write",
        "hasRole": "sysadmin",
        "isCreator": true,
        "isOwner": true
      }
    }
  },
  "auth": {
    "default": {
      "default": {
        "hasRole": "kingOmega"
      }
    }
  },
  "q": {
    "default": {
      "default": {
        "isAuthenticated": true
      }
    }
  }
}
// -------------------------------------------------------------------------------------------

describe('Auth Service', () => {
  test(' creates a new user through the signup process', async () => {
    const result = await AuthService.createNewUser(newUser);
    expect(result).toEqual(true);
  });

  test(' validates user does not exist', async () => {
    const result = await AuthService.createNewUser(newUser);
    expect(result).toEqual(false);
  });

  test(' inserts a new user role', async () => {
    const newRecord = {
      id: UUID.v4(),
      index: "system",
      user_id: "4e161226-80fc-40fd-b1e7-f97f6774d8bc",
      role: "user",
      created_by: "4e161226-80fc-40fd-b1e7-f97f6774d8bc",
      owned_by: "4e161226-80fc-40fd-b1e7-f97f6774d8bc"
    }

    const result = await AuthService.insertUpdateRole(newRecord, newRecord.created_by);
    // console.log("result = ", result);
    expect(result.id).toBeTruthy();
  });

  test(' inserts a new permission', async () => {
    const newRecord = {
      index: "users",
      role: "user",
      permission: "read",
      created_by: "4e161226-80fc-40fd-b1e7-f97f6774d8bc",
      owned_by: "4e161226-80fc-40fd-b1e7-f97f6774d8bc"
    }

    const result = await AuthService.insertUpdatePermission(newRecord, newRecord.created_by);
    // console.log("result = ", result);
    expect(result.id).toBeTruthy();
  });

  test(' gets role permissions', async () => {
    const role = 'sysadmin';
    const startTime = Date.now();

    const result = await AuthService.getRolePermissions(role);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", result);
    expect(typeof result).toEqual("object");
  });

  test(' gets user roles', async () => {
    const user = userId;

    const result = await AuthService.getUserRoles(user);
    console.log("result = ", result);
    expect(typeof result).toEqual("object");
  });

  test(' gets user permissions', async () => {
    const startTime = Date.now();
    const result = await AuthService.getUserPermissions(userId);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(typeof result).toEqual("object");
  });

  test(' gets existing roles', async () => {
    const startTime = Date.now();
    const result = await AuthService.getExistingRoles(userId);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(typeof result).toEqual("object");
  });


// ////////////////////////////////////////////////////////////////
// PRIVILEGE CHECKS (AuthService.hasPriv)

  test(' calls next() if user has privilege', async () => {
    const startTime = Date.now();
    const result = await AuthService.hasPriv()(req, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test(' uses method-level configuration object if passed', async () => {
    const route = req.baseUrl?.replace("/", "").toLowerCase();
    const method = req.method.toLowerCase();
    const index = req.params.index || req.query.index;
    const methodConfig = sampleConfig[route][method];

    // Change method-level auth config to not allow access
    methodConfig[index].hasPriv = "write";
    methodConfig[index].hasRole = "sysadmin";
    methodConfig[index].isCreator = true;     // TODO: Test this part

    const startTime = Date.now();
    const result = await AuthService.hasPriv(methodConfig)(req, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('gets user privileges from session', async () => {
    const startTime = Date.now();
    const result = await AuthService.hasPriv()(req, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('gets authorization rules from config file', async () => {
    const startTime = Date.now();
    const result = await AuthService.hasPriv()(req, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('gets authorization rules from argument, "configInput"', async () => {
    const startTime = Date.now();
    const result = await AuthService.hasPriv(sampleConfig.auth.default)(authReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result.status).toEqual(403);
  });

  test(' uses file loaded configuration if parameter is not passed', async () => {
    const startTime = Date.now();
    const result = await AuthService.hasPriv()(req, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('true if user is authenticated and no other rules exist', async () => {
    const startTime = Date.now();
    const result = await AuthService.hasPriv({default: {isAuthenticated: true}})(req, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('true if user has privilege level access', async () => {
    const startTime = Date.now();
    const result = await AuthService.hasPriv({default: {hasPriv: "specialPriv"}})(authReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('true if user has role level access', async () => {
    const specialReq = {
      baseUrl: '/auth',
      method: 'get',
      params: {index: 'profiles', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {"specialRole": true},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv({default: {hasRole: "specialRole"}})(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('true if user is creator', async () => {
    // Insert a new record with user as creator
    await IOService.insertUpdate({id: newId, test: "data", just: "delete"}, "test", userId);

    const specialReq = {
      baseUrl: '/io',
      method: 'post',
      params: {index: 'test', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv({default: {isCreator: true}})(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('true if user is owner', async () => {
    // Insert a new record with user as creator
    await IOService.insertUpdate({id: newId, test: "data", just: "delete"}, "test", userId);

    const specialReq = {
      baseUrl: '/io',
      method: 'post',
      params: {index: 'test', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv({default: {isOwner: true}})(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('true if custom rule returns true', async () => {
    const specialReq = {
      baseUrl: '/io',
      method: 'post',
      params: {index: 'test', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv({default: {ruleFunc: () => {return true}}})(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('false if custom rule returns false', async () => {
    const specialReq = {
      baseUrl: '/io',
      method: 'post',
      params: {index: 'test', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv({default: {ruleFunc: () => {return false}}})(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result?.status).toEqual(403);
  });

  test('false if user does not have any privilege', async () => {
    const specialReq = {
      baseUrl: '/io',
      method: 'post',
      params: {index: 'test', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv({default: {hasRole: "NeverGonnaGetIt"}})(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result?.status).toEqual(403);
  });

  test('uses default service level config if a specific service level config is not available', async () => {
    /*
      Requires config.json to have the following service-level definition:

      "default": {
        "default": {
          "default": {
            "hasRole": "defaultSysAdmin"
          }
        }
      }
    */

    const specialReq = {
      baseUrl: '/randomEndpointNotConfigured',
      method: 'GUESS',
      params: {index: 'profiles', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {"defaultSysAdmin": true},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv()(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('uses default method level config if a specific method level config is not available', async () => {
    /*
      Requires config.json to have the following service-level definition:

      "default": {
        "default": {
          "default": {
            "hasRole": "defaultSysAdmin"
          }
        }
      }
    */

    const specialReq = {
      baseUrl: '/randomEndpointNotConfigured',
      method: 'NOTAVAILABLE',
      params: {index: 'profiles', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {"defaultSysAdmin": true},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv()(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('uses default index level config if a specific index level config is not available', async () => {
    const specialReq = {
      baseUrl: '/randomEndpointNotConfigured',
      method: 'NOTAVAILABLE',
      params: {index: 'profiles', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {"defaultSysAdmin": true},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv({default: {hasRole: "defaultSysAdmin"}})(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });

  test('false if no config is available and ALLOW_ACCESS_BY_DEFAULT option is false', async () => {
    process.env.ALLOW_ACCESS_BY_DEFAULT = "false";

    const specialReq = {
      baseUrl: '/randomEndpointNotConfigured',
      method: 'NOTAVAILABLE',
      params: {index: 'profiles', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {"defaultSysAdmin": true},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv({})(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result.status).toEqual(403);
  });

  test('true if no config is available and ALLOW_ACCESS_BY_DEFAULT option is true', async () => {
    process.env.ALLOW_ACCESS_BY_DEFAULT = "true";

    const specialReq = {
      baseUrl: '/randomEndpointNotConfigured',
      method: 'NOTAVAILABLE',
      params: {index: 'profiles', id: newId},
      user: {
        id: userId,
        auth: {
          "permissions": {},
          "roles": {"defaultSysAdmin": true},
          "rolePermissions": {}
        }
      }
    }

    const startTime = Date.now();
    const result = await AuthService.hasPriv({})(specialReq, res, next);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(result).toEqual(expectedResult);
  });
});

