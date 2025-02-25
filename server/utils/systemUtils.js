const knexInstance = require("../db/knexInstance");
const logger = require("./logger.js");

/***********************************************************
 * Insert or update a record.
 *
 * Similar to the IoService.InsertUpdate() function. However, this
 * function will insert/update each table column (instead of just the
 * `json_data` property). Therefore, this function is to only be used
 * internally for system database updates. For example, roles and permissions.
 *
 * The 'data' object properties must match the database column names exactly.
 *
 * @param data: {Object} The data object to insert/update.
 * @param index {String} The table to insert/update into.
 * @returns {Promise<T>} The database update promise and results.
 ***********************************************************/
exports.insertUpdate = (data, index) => {
  return knexInstance(index)
    .where({id: data.id})
    .select("id")
    .then(async (results) => {
      logger.info("[SystemUtils] insertUpdate(",index,"): Existing records with ID: ", results);
      if (results.length >= 1) {
        console.log("UPDATE: ", data);

        return knexInstance(index)
          .returning('id')
          .where({id: data.id})
          .update(data)
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
        return knexInstance(index)
          .returning('id')
          .insert(data)
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

// Error handling
exports.verifyRequiredFields = (dataIn, requiredFields = []) => {
  requiredFields.forEach((field) => {
    if (!dataIn[field]) {
      const msg = `Missing required field: ${field}`;
      return {result: false, msg: msg};
    }
  });
  return {result: true, msg: "No required fields missing"};
}