const knexInstance = require("../db/knexInstance");
const UUID = require("uuid");
const IoService = require("../services/io/ioService");

const USERS_TABLE = "users";

const getUserIdByEmail = (email) => {
  return knexInstance(USERS_TABLE)
    .returning('id')
    .where({email: email})
    .then((results,) => {
      return results[0]?.id;
    });
}

const getUsernameByEmail = (email) => {
  return knexInstance(USERS_TABLE)
    .returning('username')
    .where({email: email})
    .then((results,) => {
      return results[0]?.username;
    });
}

/*****************************************************
 * Create a profile record
 *
 * @param tempProfile
 * @returns {Promise<>}
 *****************************************************/
const createProfile = (tempProfile = {}) => {
  // console.log("createProfile(",tempProfile,")");
  tempProfile.id = tempProfile.id || UUID.v4();

  // TODO: 1. Get any existing profile data
  // TODO: 2. Merge any new props/values into existing profile
  // TODO: 3. Save the new props/values with the previous ones

  return IoService.insertUpdate(tempProfile, "profiles", tempProfile.userId);
}

/*************************************************************
 * Creates a new user.
 *
 *
 * @param userObj
 * @returns {Promise<string>} New User ID or error message.
 *************************************************************/
const createUser = (userObj) => {
  if(!userObj?.email) {
    console.log("[UserUtils] createUser(",userObj,"): ERROR - Unable to create a new user without an email address.");
    return Promise.reject("Missing email address");
  }

  // Generate UUID
  const newId = userObj.id || UUID.v4();
  const json_data = userObj.json_data || {id: newId, email: userObj.email};

  const columns = {
    id: newId,
    username: userObj.username || null,
    email: userObj.email || null,
    hashed_password: userObj.hashedPassword || null,
    salt: userObj.salt || null,
    json_data: json_data
  }


  return knexInstance(USERS_TABLE)
    .returning('id')
    .insert(columns)
    .then((result,) => {
      console.log("[UserUtils] Created new user result: ", result);

      createProfile({userId: newId, contactInfo: {email: userObj.email}}); // Insert local profile record

      return result[0].id;
    })
    .catch((e) => {
      console.log(e);
      return e;
    });
}

/*****************************************************************
 * Validate username
 *
 *    Checks that the username string passes the set of rules. If any
 *    rule is violated, an error message indicating the violation is
 *    returned.
 *
 * @param username {string}: The username string to validate
 * @returns {string}: Error messages, if any. Otherwise, a blank string
 *****************************************************************/
const validateUsername = (username = '') => {
  const invalidSymbols = ['@'];

  if (!username || typeof username !== "string") {
    return "Username must be a non-empty string";
  }

  for (let i=0; i<invalidSymbols.length; i++) {
    if (username.includes(invalidSymbols[i])) {
      return `Username may not contain the '${invalidSymbols[i]}' symbol`
    }
  }

  // Additional rules here

  return '';
}

/*****************************************************************
 * Validate email
 *
 *    Checks that the email string passes the set of rules. If any
 *    rule is violated, an error message indicating the violation is
 *    returned.
 *
 * @param email {string}: The email string to validate
 * @returns {string}: Error messages, if any. Otherwise, a blank string
 *****************************************************************/
const validateEmail = (email = '') => {
  const emailRegex = new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  if (!emailRegex.test(email)) {
    return 'Email is not valid';
  }

  return '';
}

module.exports = {createUser, getUserIdByEmail, getUsernameByEmail, validateUsername, validateEmail};