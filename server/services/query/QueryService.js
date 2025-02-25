'use strict';

const knexInstance = require("../../db/knexInstance");
const UUID = require("uuid");

// TODO: Define this in one place and import it here and in 'IO Service'
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



  return knexInstance(internalTables[index] || 'io')
    .select("json_data")
    .select(knexInstance.raw('ROW_NUMBER() OVER(), COUNT(*) OVER()'))
    .limit(limit)
    .offset(offset)
    .where(
      (builder) => {
        // Build SELECT statement...
        for (const condition of query.conditions) {
          if (condition.operator.toUpperCase() === "HAS") {
            builder.whereJsonSupersetOf('json_data', condition.value)
          } else if (condition.path) {
            builder.whereJsonPath('json_data', "$." + condition.path, condition.operator, condition.value);
          }
        }
        // TODO: Support sub-conditions (AND, OR) for grouping conditions
      }
    )

    // TODO: Group by clause

    // TODO: Sort clause

    .then((results) => {
      console.log("query results = ", results);

      // if (!results[0]?.row_number) return results;   // If we don't have the metadata in the results, just return them.

      // Parse metadata if it exists in the results.
      const startRowNumber = typeof results[0]?.row_number === "string" ? parseInt(results[0].row_number, 10) : 0;
      const count = typeof results[0]?.count === "string" ? parseInt(results[0].count, 10) : 0;
      const output = {
        meta: {
          rowCount: count,
          rowStart: startRowNumber,
          rowEnd: startRowNumber + results.length - 1
        },
        rows: []
      };

      // Restructure output data
      results.forEach((row) => {
        output.rows.push(row.json_data);
      })

      return output;
    })
    .catch((e) => {
      console.log(e);
    })
}

// JAVA code to do everything is below. Needs to be ported to JS/Knex.js...

/*************************************************************
 * @param queryFilter: The QueryFilter object to process
 * @return {String} The generated SQL WHERE clause.
 *************************************************************/
// protected String generateFilter(QueryServiceFilter queryFilter) {
// //    logger.debug("generateFilter({})", queryFilter);
//   StringBuilder strFilter = new StringBuilder();
//
//   if (queryFilter != null && queryFilter.getConditions() != null) {
//     boolean first = true;
//     for (final QueryServiceCondition condition : queryFilter.getConditions()) {
//       if (first) {   // Ignore the first condition's conditional
//         strFilter.append(SQL_WHERE_BASIC);
//       } else {
//         strFilter.append(this.generateConditional(condition));
//       }
//       strFilter.append(SQL_LEFT_PAREN);
//       strFilter.append(this.generateCondition(condition));
//       strFilter.append(SQL_RIGHT_PAREN);
//       first = false;
//     }
//   }
//
//   return strFilter.toString();
// }


/*************************************************************
 * @param queryFilterCondition
 * @return {String}: Generated WHERE clause.
 *************************************************************/
// @Override
// protected String generateCondition(QueryServiceCondition condition) {
//   StringBuilder strFilter = new StringBuilder();
//
//   // Error Handling
//   if (condition == null) {
//     return strFilter.toString();
//   }
//
//   if (condition.getOperator() == QueryServiceCondition.OperatorEnum.IN) {
//     if (condition.getValues() != null && !condition.getValues().isEmpty()) {
//       strFilter.append(SQL_JSON_TEXTCONTAINS + JSON_DATA + SQL_JSON_TEXT_BEGINNING + condition.getPath().get(0) + SQL_SINGLE_QUOTE + SQL_COMMA +
//         "?" + SQL_RIGHT_PAREN);
//     } else {
//       throw new IllegalArgumentException("Conditions with 'IN' operator must contain at least one value: " + condition.getPath());
//     }
//   } else {
//     if (condition.getOperator() == QueryServiceCondition.OperatorEnum.LIKE) {
//       strFilter.append(SQL_JSON_TEXTCONTAINS + JSON_DATA + SQL_JSON_TEXT_BEGINNING + condition.getPath().get(0) + SQL_SINGLE_QUOTE + SQL_COMMA + SQL_SINGLE_QUOTE + SQL_WILDCARD + escape((String) condition.getValues().toArray()[0])
//       + SQL_WILDCARD + SQL_SINGLE_QUOTE + SQL_RIGHT_PAREN);
//     } else {
//       if (condition.getOperator() == QueryServiceCondition.OperatorEnum.NEQ) {
//         strFilter.append(SQL_NOT);
//       }
//       strFilter.append(SQL_JSON_EXISTS + JSON_DATA + SQL_JSON_FUNCTION_BEGINNING + condition.getPath().get(0) + getSQLOperator(condition.getOperator()) + SQL_DOUBLE_QUOTE + (String) condition.getValues().toArray()[0]
//       + SQL_DOUBLE_QUOTE + SQL_JSON_FUNCTION_ENDING);
//     }
//   }
//
//   strFilter.append(this.generateSubConditions(condition.getSubConditions()));
//
//   return strFilter.toString();
// }


/*************************************************************
 * @param QueryServiceCondition[]: Array of sub-conditions to group.
 * @return {String}: Generated group of sub-conditions for WHERE clause.
 *************************************************************/
// protected String generateSubConditions(java.util.List<QueryServiceCondition> subConditions) {
//   StringBuilder strFilter = new StringBuilder();
//   if (subConditions != null) {
//     for (final QueryServiceCondition c : subConditions) {
//       strFilter.append(this.generateConditional(c));
//       strFilter.append(SQL_LEFT_PAREN);
//       strFilter.append(this.generateCondition(c));
//       strFilter.append(SQL_RIGHT_PAREN);
//     }
//   }
//   return strFilter.toString();
// }


/*************************************************************
 * @param QueryServiceCondition: Condition object to process.
 * @return {String}: Generated conditional for WHERE clause ("OR" or "AND" [default]).
 *************************************************************/
// protected String generateConditional(QueryServiceCondition condition) {
//   if(condition.getConditional() == QueryServiceCondition.ConditionalEnum.OR) {
//     return SQL_OR;
//   } else {
//     return SQL_AND;
//   }
// }


/*************************************************************
 * Generates the GROUP BY clause.
 *
 * @param queryFilter {QueryServiceFilter}
 * @param limit {int}
 * @param offset {int}
 * @return {String} GROUP BY string
 *************************************************************/
// @Override
// protected String generateGroup(QueryServiceFilter queryFilter, int limit, int offset) {
//   final StringBuilder strGroup = new StringBuilder();
//   if (queryFilter != null && queryFilter.getGroups() != null && !queryFilter.getGroups().isEmpty()) {
//     strGroup.append(SQL_GROUPBY);
//     boolean first = true;
//     for (final QueryServiceGroup group : queryFilter.getGroups()) {
//       if (!first) {
//         strGroup.append(SQL_COMMA);
//       }
//       strGroup.append(JSON_DATA + SQL_JSON_FIELD_AS_TEXT_OPERATOR + SQL_SINGLE_QUOTE + group.getPath() + SQL_SINGLE_QUOTE);
//       first = false;
//     }
//   }
//
//   return strGroup.toString();
// }

// Possible group by example for json paths...
// knex.groupByRaw(json_data->>'path.to.property')   // PGSQL
// knex.groupByRaw(json_value(json_data,'$.path.to.property'))   // Oracle

/*************************************************************
 *
 * @param queryFilter {QueryServiceFilter}
 * @param limit {int}
 * @param offset {int}
 * @return {String}: Generated ORDER BY clause.
 *************************************************************/
// @Override
// protected String generateSort(QueryServiceFilter queryFilter, int limit, int offset) {
//   final StringBuilder strFilter = new StringBuilder();
//   if (queryFilter != null && queryFilter.getSorts() != null && !queryFilter.getSorts().isEmpty()) {
//     strFilter.append(SQL_ORDERBY);
//     boolean first = true;
//     for (final QueryServiceSort sort : queryFilter.getSorts()) {
//       if (!first) {
//         strFilter.append(SQL_COMMA);
//       }
//       strFilter.append(JSON_DATA + SQL_JSON_FIELD_AS_TEXT_OPERATOR + SQL_SINGLE_QUOTE + sort.getPath() + SQL_SINGLE_QUOTE);
//       strFilter.append((sort.getSortOrder() == QueryServiceSort.SortOrderEnum.DESC ? SQL_DESC : SQL_ASC));
//       first = false;
//     }
//   }
//
//   if (strFilter.length() == 0 && (offset > 0 || limit > 0)) {
//     // if pagination and no sort order defined then use datecreated desc
//     strFilter.append(SQL_ORDERBY);
//     strFilter.append(JSON_DATE_CREATED);
//     strFilter.append(SQL_DESC);
//   }
//
//   return strFilter.toString();
// }

// Possible sort by json path solution...
/*
  knex('your_table')
    .select('*')
    .orderByRaw('json_extract(your_json_column, ?) ASC', '$.path.to.sort.field')
    .then(results => {
      // Process the results
    });

 knex.orderByRaw('json_extract(json_data, ?) ASC', '$.path.to.sort.field')

*/