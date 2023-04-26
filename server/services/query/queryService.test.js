const knexInstance = require("../../db/knexInstance");
const QueryService = require("./QueryService.js");z
// const describe = require("jest");

describe('Query Service', () => {
  test(' handles blank queries', async () => {
    const result = await QueryService.query({}, "profiles", 0, 0);
    console.log("result = ", result);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  test(' queries for max results if a limit is not specified', async () => {
    const limit = 0;
    const result = await QueryService.query({}, "profiles", limit, 0);
    console.log("result = ", result);
    expect(result.length).toBeGreaterThan(limit);
  });

  test(' limits query results', async () => {
    const limit1 = 1;
    const limit2 = 2;
    const result1 = await QueryService.query({}, "profiles", limit1, 0);
    const result2 = await QueryService.query({}, "profiles", limit2, 0);
    console.log("result1 = ", result1);
    console.log("result2 = ", result2);
    expect(result1.length).toBe(limit1);
    expect(result2.length).toBe(limit2);
  });

  test(' queries for json_data', async () => {
    const query = {
      conditions: [{
        path: "userId",
        operator: "=",
        value: "4adb8cdf-3ad6-4da9-a0c5-922471a40224"
      }]
    };
    const result = await QueryService.query(query, "profiles", 0, 0);
    console.log("result = ", result);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });


  test(' queries nested json_data deeper than one level', async () => {
    const query = {
      conditions: [{
        path: "",
        operator: "HAS",
        value: {approvalDetails: {approvers: [{approverId: "050394cd-dbcd-4b30-9f0a-e2d70d1b956e"}]}}
      }]
    };
    const result = await QueryService.query(query, "reqs", 0, 0);
    console.log("result = ", result);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });


});

