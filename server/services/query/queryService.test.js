const knexInstance = require("../../db/knexInstance");
const QueryService = require("./QueryService.js");
// const describe = require("jest");

describe('Query Service', () => {
  test(' handles blank queries', async () => {
    const result = await QueryService.query({}, "profiles", 0, 0);
    console.log("result = ", result);
    expect(result?.rows.length).toBeGreaterThanOrEqual(0);
  });

  test(' queries for max results if a limit is not specified', async () => {
    const limit = 0;
    const result = await QueryService.query({}, "profiles", limit, 0);
    console.log("result = ", result);
    expect(result?.meta.rowCount).toEqual(result?.rows.length);
  });

  test(' limits query results', async () => {
    const limit1 = 1;
    const limit2 = 2;
    const result1 = await QueryService.query({}, "profiles", limit1, 0);
    const result2 = await QueryService.query({}, "profiles", limit2, 0);
    console.log("result1 = ", result1);
    console.log("result2 = ", result2);
    expect(result1?.rows?.length).toBe(limit1);
    expect(result2?.rows?.length).toBe(limit2);
  });

  test(' queries for json_data', async () => {
    const query = {
      conditions: []
    };
    const result = await QueryService.query(query, "profiles", 0, 0);
    console.log("result = ", result);
    expect(result.rows.length).toBeGreaterThanOrEqual(0);
  });


  test(' queries nested json_data deeper than one level', async () => {
    const query = {
      conditions: [{
        path: "",
        operator: "HAS",
        value: {contactInfo: {email: "a@stusys.com"}}
      }]
    };
    const query2 = {
      conditions: [{
        path: "contactInfo",
        operator: "HAS",
        value: {email: "a@stusys.com"}
      }]
    };


    const result = await QueryService.query(query, "profiles", 0, 0);
    const result2 = await QueryService.query(query2, "profiles", 0, 0);
    console.log("result = ", JSON.stringify(result));
    console.log("result2 = ", JSON.stringify(result2));
    expect(result.rows.length).toBeGreaterThanOrEqual(0);
    expect(result2.rows.length).toBeGreaterThanOrEqual(0);
  });


});

