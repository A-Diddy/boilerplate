// const knexInstance = require("../../db/knexInstance");
const UserUtils = require("./userUtils.js");
// const describe = require("jest");

describe('User Utils', () => {
  test('validateEmail() returns blank string if a valid email is provided', async () => {
    const result = UserUtils.validateEmail('thisEmailIsValid@valid.com');
    console.log("result = ", result);
    expect(result).toEqual('');
  });

  test('validateEmail() returns error description string if a valid email is NOT provided', async () => {
    const result = UserUtils.validateEmail('thisEmailIsNotValid');
    console.log("result = ", result);
    expect(result).toEqual('Email is not valid');
  });
});

