'use strict';

const knexInstance = require("../../db/knexInstance");

const logger = require("../../utils/logger.js");

const UUID = require("uuid");

const internalTables = {
  "users": "users",
  "tokens": "tokens",
  "permissions": "permissions",
  "profiles": "profiles",
  "orgs": "orgs",
  "media": "media",
  "events": "events",
  "actions": "actions",
  "config": "config",
  "io": "io",
  "media_binary": "media_binary",
  "federated_credentials": "federated_credentials",
  "sessions": "sessions"
}

/**
 * Delete an existing object with the specified ID (as a URL parameter)
 *
 * index String Type of record. This resolves to the table to delete from. Defaults to 'io' table.
 * id UUID
 * returns String
 **/
exports.deleteByIdFromPath = function (index, id) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Delete an existing object with the specified ID (from the body)
 *
 * id UUID
 * index String Type of record. This resolves to the table to delete from. Defaults to 'io' table. (optional)
 * returns String
 **/
exports.deleteObject = function (id, index) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/*******************************************************
 * Retrieve an existing record by UUID (id).
 *
 * index: [String] (Default = 'io') Type of record. This resolves to the IO index or internal table to retrieve from.
 * id: String UUID of object to retrieve. Defaults to 'io'.
 *
 * returns List
 *******************************************************/
exports.getById = function (index = 'io', id) {
  return knexInstance(internalTables[index] || 'io')
    .where({"id": id})
    .select('json_data')
    .then((res) => {
      console.log("[IoService] getById() = ", res);
      return normalizeData(res)[0] || {};
    });
}

/*******************************************************
 * Retrieve an existing record by UUID (id).
 *
 * index: [String] (Default = 'io') Type of record. This resolves to the IO index or internal table to retrieve from.
 * id: String UUID of object to retrieve. Defaults to 'io'.
 *
 * returns List
 *******************************************************/
exports.getMetaById = function (id, index = 'io') {
  return knexInstance(internalTables[index] || 'io')
    .where({"id": id})
    .select(['created_by', 'owned_by', 'created_at', 'updated_at'])
    .then((res) => {
      console.log("[IoService] getMetaById() = ", res);
      return normalizeData(res)[0] || {};
    });
}



/**
 * Retrieve an existing record by ID (as a URL parameter).
 *
 * index String Type of record. This resolves to the table to retrieve from. Defaults to 'io' table.
 * id String UUID of object to retrieve.
 * returns List
 **/
exports.getByIdFromPath = function (index, id) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = ["", ""];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Update an existing record or insert a new record based on UUID.
 *
 * body IOObj The keys and values to be patched
 * index String Type of record. This resolves to the table to insert into. Defaults to 'io' table. (optional)
 * created_by String User ID of the authenticated user that originated the request.
 *
 * returns Object
 **/
exports.insertUpdate = function (body, index, created_by = "unknown") {
  logger.info(`[IoService] insertUpdate(${index}): ID to insert/update: ${body.id}`
  )

  // Support for json_data sent in body instead of as IOObj ({id, json_data})
  const data = body.json_data || body;    // json_data
  data.id = body.id || body.json_data?.id || UUID.v4(); // id: Give IOObj.id priority over IOObj.json_data.id (in case they diff.).
  created_by = created_by !== "unknown" ? created_by : data.user_id || data.userId || "unknown";

  return knexInstance(internalTables[index] || 'io')
    .where({id: data.id})
    .select("id")
    .then(async (results) => {
      console.log("[IoService] insertUpdate(", index, "): Existing records with ID: ", results);
      if (results.length >= 1) {
        console.log("UPDATE: ", data);
        if (results[0].index !== (internalTables[index] || 'io')) {
          logger.info(`[ioService] insertUpdate(): ` +
          `wtf... changing the index (${results[0].index} vs ${index}) of a record or reusing a UUID (${data.id})??`);
        }
        return knexInstance(internalTables[index] || 'io')
          .returning('id')
          .where({id: data.id})
          .update('json_data', data)
          .then((result) => {
            const returnResult = {
              status: "updated",
              id: result[0].id
            }
            return returnResult
          })
          .catch((e) => {
            console.log(e);
          });
      } else {
        console.log("INSERT: ", data);
        return knexInstance(internalTables[index] || 'io')
          .returning('id')
          .insert({id: data.id, index: index, json_data: data, created_by: created_by, owned_by: created_by})
          .then((result,) => {
            const returnResult = {
              status: "created",
              id: result[0].id
            }
            return returnResult
          })
          .catch((e) => {
            console.log(e);
          });
      }
    })
}

const isDataValid = (index, id) => {

  return true;
}


/************************************************
 * Normalize data
 *
 *  Adds db server columns created_at and updated_at
 *  to json_data.
 *
 * @param resultSet
 * @returns {*[]}
 * ************************************************/
const normalizeData = (resultSet) => {
  let resultArray = [];
  if (resultSet?.length < 0) {
    resultArray.push(resultSet);
  } else {
    resultArray = resultSet;
  }

  for (let i = 0; i < resultArray?.length; i++) {
    const result = resultArray[i];
    if (!result.json_data) {
      result.json_data = {};
    }
    if (result.created_at) {
      result.json_data.created_at = result.created_at;
    }
    if (result.updated_at) {
      result.json_data.updated_at = result.updated_at;
    }
  }

  return resultArray;
}
