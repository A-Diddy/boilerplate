const knexInstance = require("../../db/knexInstance");
const AuthService = require("./authService.js");
const UUID = require('uuid');
// const describe = require("jest");

const userId = '4e161226-80fc-40fd-b1e7-f97f6774d8bc';
const userId2 = '4e161226-80fc-40fd-b1e7-f97f6774d8bb';

describe('Auth Service', () => {
  test(' creates a new user through the signup process', async () => {

    expect(true).toEqual(false);
  });

  test(' inserts a new user role', async () => {
    const newRecord = {
      id: UUID.v4(),
      index: "system",
      user_id: "4e161226-80fc-40fd-b1e7-f97f6774d8bc",
      role: "user",
      created_by: "4e161226-80fc-40fd-b1e7-f97f6774d8bc",
      owned_by: "4e161226-80fc-40fd-b1e7-f97f6774d8bc"
    }

    const result = await AuthService.insertUpdateRole(newRecord, newRecord.created_by);
    // console.log("result = ", result);
    expect(result.id).toBeTruthy();
  });

  test(' inserts a new permission', async () => {
    const newRecord = {
      index: "users",
      role: "user",
      permission: "read",
      created_by: "4e161226-80fc-40fd-b1e7-f97f6774d8bc",
      owned_by: "4e161226-80fc-40fd-b1e7-f97f6774d8bc"
    }

    const result = await AuthService.insertUpdatePermission(newRecord, newRecord.created_by);
    // console.log("result = ", result);
    expect(result.id).toBeTruthy();
  });

  test(' gets role permissions', async () => {
    const role = 'sysadmin';
    const startTime = Date.now();

    const result = await AuthService.getRolePermissions(role);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", result);
    expect(typeof result).toEqual("object");
  });

  test(' gets user roles', async () => {
    const user = userId;

    const result = await AuthService.getUserRoles(user);
    console.log("result = ", result);
    expect(typeof result).toEqual("object");
  });

  test(' gets user permissions', async () => {
    const startTime = Date.now();
    const result = await AuthService.getUserPermissions(userId);
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(typeof result).toEqual("object");
  });

  test(' gets existing roles', async () => {
    const startTime = Date.now();
    const result = await AuthService.getExistingRoles();
    const endTime = Date.now();
    console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
    console.log("result = ", JSON.stringify(result));
    expect(typeof result).toEqual("object");
  });




  // TODO: ....
  // test(' gets existing permissions', async () => {
  //   const startTime = Date.now();
  //   const result = await AuthService.getExistingPermissions();
  //   const endTime = Date.now();
  //   console.log("Time in milliseconds: ", endTime - startTime, " milliseconds");
  //   console.log("result = ", JSON.stringify(result));
  //   expect(typeof result).toEqual("object");
  // });
});

