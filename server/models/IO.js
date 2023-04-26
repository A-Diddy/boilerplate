const knexInstance = require("../db/knexInstance");
const UUID = require('uuid');

class IO {
  constructor(index = "io", id = null, json_data = {}, org_id = null) {
    this.index = index || "io";
    this.id = id || null;
    this.json_data = json_data || {};
    this.org_id = org_id || null;
  }

  toIO() {
    return {
      index: this.index,
      id: this.id,
      json_data: this.json_data,
      org_id: this.org_id
    }
  }

  /**********************************************************************
   * Insert or update a record.
   *
   *  Given the following data, insert or update a record:
   *    - index (table name)
   *    - id (unique identifier per index)
   *    - json_data
   *
   * @param data {object}: {index: string, id: string, json_data: object}
   * @returns {Promise<T>}
   **********************************************************************/
  insertUpdate(data) {
    data = data || this.toIO();

    return knexInstance(data.index)
      .where({ id: data.id })
      .select("id")
      .then(async (results) => {
        if (results.length) {
          console.log("UPDATE: ", data);
          return knexInstance(data.index)
            .returning('id')
            .where({ id: data.id })
            .update('json_data', data.json_data)
            .then((result) => {return result})
            .catch((e) => {
              console.log(e);
            });
        } else {
          console.log("INSERT: ", data);
          return knexInstance(data.index)
            .returning('id')
            .insert({ id: data.id, json_data: data.json_data })
            .then((result, ) => {return result})
            .catch((e) => {
              console.log(e);
            });
        }
      })
  }

  /**********************************************************************
   * Fetch data.
   *
   *  Given the following data, fetch the associated records:
   *    - index (table name)
   *    - id (unique identifier per index)
   *    - org_id
   *
   * @param query
   **********************************************************************/
  query(query) {
    query = query || {};
    query.index = query.index || this.index;
    const q = {};

    // Error handling
    if (!query.index) {
      const msgCode = "ERROR";
      const msg = "'index' (table) not specified";
      console.log("[IO] fetch(",query,"): ",msgCode," - ",msg ,"... exiting");
      return new Promise((reject) => {
        reject({
          msgCode: msgCode,
          msg: msg
        });
      });
    }
    if (!query.id) {
      console.log("[IO] fetch(",query,"): WARNING - 'id' not specified... any ID will be in scope for query");
      // query.id = "%";
    } else {
      q.id = query.id;
    }
    if (!query.org_id) {
      console.log("[IO] fetch(",query,"): WARNING - 'org_id' not specified... retrieving data for each org");
    }

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
    /*
        // Conditions
        const conditions = [];
        if (q.conditions && q.conditions.length > 0) {
          for (const condition of q.conditions) {
            if (!condition.path) {
              continue;
            }
            const jsonQuery = {col: "json_data", path: "$."+condition.path, operator: condition.operator, value: condition.value};
            conditions.push(jsonQuery);
          }
        }

        console.log("conditions: ", conditions);
    */

    console.log("Attempting query on table ",query.index,": ", q);

    return knexInstance(query.index)
      // .jsonExtract(selectors)
      .where(q)
      // .whereJsonPath(conditions)
      .select("json_data")
  }

  /*****************************************************
   * Save.
   *
   *  Convenience function for `insertUpdate()`.
   *  Requires that the object has a UUID in the 'id' property.
   *  Otherwise, one will be added.
   *
   * @param index
   * @param obj
   * *****************************************************/
  save(index, obj) {
    if (!UUID.validate(obj.id)) {
      obj.id = UUID.v5();
    }
    const data = {
      index: index,
      id: obj.id,
      json_data: obj
    }
    this.insertUpdate(data);
  }
}

module.exports = IO;

