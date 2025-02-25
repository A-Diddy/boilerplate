const knexInstance = require("../../db/knexInstance");
const IoService = require("./IoService.js");
const UUID = require('uuid');
// const describe = require("jest");

describe('IO Service', () => {
  test(' inserts a new record', async () => {
    const newRecord = {
      "id": UUID.v4(),
      "userId": UUID.v4(),
      "contactInfo": {
        "email": "test@test.com"
      }
    }

    const result = await IoService.insertUpdate(newRecord, "profiles", newRecord.userId);
    // console.log("result = ", result);
    expect(result.id).toEqual(newRecord.id);
  });

  test(' updates an existing record', async () => {
    const newRecord = {
      "id": UUID.v4(),
      "userId": UUID.v4(),
      "contactInfo": {
        "email": "test@test.com"
      }
    }

    const result = await IoService.insertUpdate(newRecord, "profiles", newRecord.userId);
    const result2 = await IoService.insertUpdate(newRecord, "profiles", newRecord.userId);
    // console.log("result = ", result);
    // console.log("result2 = ", result2);
    expect(result.id).toEqual(newRecord.id);
    expect(result2.id).toEqual(newRecord.id);
    expect(result2.status).toEqual("updated");
  });

  test(' creates a new UUID if one is not provided', async () => {
    const newRecord = {
      "userId": UUID.v4(),
      "contactInfo": {
        "email": "test@test.com"
      }
    }

    const result = await IoService.insertUpdate(newRecord, "profiles", newRecord.userId);
    // console.log("result = ", result);
    expect(result.id).toBeTruthy();
  });

  test(' uses the "userId" from the object if one is not provided as a parameter', async () => {
    const newRecord = {
      "id": UUID.v4(),
      "userId": UUID.v4(),
      "contactInfo": {
        "email": "test@test.com"
      }
    }

    const result = await IoService.insertUpdate(newRecord, "profiles");
    // console.log("result = ", result);
    const resultMeta = await IoService.getMetaById(newRecord.id, "profiles");
    expect(resultMeta.created_by).toEqual(newRecord.userId);
  });

  test(' uses the "user_id" from the object if one is not provided as a parameter', async () => {
    const newRecord = {
      "id": UUID.v4(),
      "user_id": UUID.v4(),
      "contactInfo": {
        "email": "test@test.com"
      }
    }

    const result = await IoService.insertUpdate(newRecord, "profiles");
    // console.log("result = ", result);
    const resultMeta = await IoService.getMetaById(newRecord.id, "profiles");
    expect(resultMeta.created_by).toEqual(newRecord.user_id);
  });
});

