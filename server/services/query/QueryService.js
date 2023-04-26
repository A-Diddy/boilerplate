'use strict';

const knexInstance = require("../../db/knexInstance");


const MAX_RESULTS = 50;

/**
 * Query for a list of objects
 *
 * body QueryServiceFilter Query model that will be passed to database for filtering the data.
 * index String Type of record. This resolves to the table to query. (optional)
 * limit Integer Max number of records to return at one time. 0 = unlimited (default) (optional)
 * offset Integer Enables pagniation. Skips the first X number of records in the results. (optional)
 * returns List
 **/
exports.query = function (body, index, limit, offset) {

  limit = (limit > 0 && limit < MAX_RESULTS) ? limit : MAX_RESULTS;

  console.log("[QueryService] query(", {body, index, limit, offset}, ")");

  const query = body || {};
  const q = {};

  // Error handling
  if (!index) {
    const msgCode = "ERROR";
    const msg = "'index' (table) not specified";
    console.log("[QueryService] query(", query, "): ", msgCode, " - ", msg, "... defaulting to 'io'");
    index = "io";
    // return new Promise((reject) => {
    //   reject({
    //     msgCode: msgCode,
    //     msg: msg
    //   });
    // });
  }

  query.conditions = query.conditions || [];


  // if (!query.id) {
  //   console.log("[IO] fetch(",query,"): WARNING - 'id' not specified... any ID will be in scope for query");
  //   // query.id = "%";
  // } else {
  //   q.id = query.id;
  // }
  // if (!query.store_id) {
  //   console.log("[IO] fetch(",query,"): WARNING - 'store_id' not specified... retrieving data for each store");
  // }

  /*

      // Selectors (jsonExtract())
      let selectors = [];

      if (q.selectors) {
        if (!q.selectors.length) {
          q.selectors = [q.selectors]; // Put single selector into an array
        }

        q.selectors.forEach((selector) => {
          if (selector.path) {
            const as = selector.as || selector.path;
            selectors.push(["json_data", "$."+selector.path, as]);
          }
        })
      }

      // selectors = ["id"]

      console.log("Selectors: ", selectors);
  */

  return knexInstance(index)
    // .jsonExtract(selectors)
    // .where(q)
    .select("json_data")
    .limit(limit)
    .offset(offset)
    // .whereJsonPath(conditions, ``,  )
    .where(
      (builder) => {
        for (const condition of query.conditions) {

          if (condition.operator.toUpperCase() === "HAS") {
            builder.whereJsonSupersetOf('json_data', condition.value)
          }

          else if (condition.path) {
            builder.whereJsonPath('json_data', "$." + condition.path, condition.operator, condition.value)
          }
        }

      }
    )
    .then((results) => {
      console.log("query results = ", results);

      return results;
    })
    .catch((e) => {
      console.log(e);
    })

}

