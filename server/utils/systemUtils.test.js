const SystemUtils = require("./systemUtils");

// -------------------------------------------------------------------------------------------
// SAMPLE REQUEST, RESPONSE AND NEXT()
//

const maliciousFunction = (param) => {
  console.log("maliciousFunction() Called");
  console.log("Calling param = ", param);
  console.log("Calling global = ", globalThis);

  // print("Calling global...");

  return true;
}
// -------------------------------------------------------------------------------------------

describe('System Utils', () => {
  test('.limitScope() limits the scope of the function passed in', async () => {
    const result = await SystemUtils.limitScope(maliciousFunction);
    expect(result).toEqual(true);
  });

});

