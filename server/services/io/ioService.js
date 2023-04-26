'use strict';

const knexInstance = require("../../db/knexInstance");

const logger = require("../../utils/logger.js");


/**
 * Delete an existing object with the specified ID (as a URL parameter)
 *
 * index String Type of record. This resolves to the table to delete from. Defaults to 'io' table.
 * id UUID
 * returns String
 **/
exports.deleteByIdFromPath = function(index,id) {
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


/**
 * Delete an existing object with the specified ID (from the body)
 *
 * id UUID
 * index String Type of record. This resolves to the table to delete from. Defaults to 'io' table. (optional)
 * returns String
 **/
exports.deleteObject = function(id,index) {
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


/**
 * Retrieve an existing record by UUID (id).
 *
 * index String Type of record. This resolves to the table to retrieve from. Defaults to 'io' table.
 * id String UUID of object to retrieve. Defaults to 'io'.
 * returns List
 **/
exports.getById = function(index = 'io', id) {
  return knexInstance(index)
    .where({"id": id})
    .select('json_data')
    .then((res) => {
      console.log("[IoService] getById() = ", res);
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
exports.getByIdFromPath = function(index,id) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ "", "" ];
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
 * returns String
 **/
exports.insertUpdate = function(body,index) {
  logger.info(`[IoService] insertUpdate(${index}): ID to insert/update: ${body.id}`
  )

  const data = body;    // json_data

  return knexInstance(index)
    .where({ id: data.id })
    .select("id")
    .then(async (results) => {
      console.log("[IoService] insertUpdate(",index,"): Existing records with ID: ", results);
      if (results.length >= 1) {
        console.log("UPDATE: ", data);
        return knexInstance(index)
          .returning('id')
          .where({ id: data.id })
          .update('json_data', data)
          .then((result) => {return result})
          .catch((e) => {
            console.log(e);
          });
      } else {
        console.log("INSERT: ", data);
        return knexInstance(index)
          .returning('id')
          .insert({ id: data.id, json_data: data })
          .then((result, ) => {return result})
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

  for (let i=0; i < resultArray?.length; i++) {
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
