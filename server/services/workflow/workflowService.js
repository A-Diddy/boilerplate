'use strict';
const knexInstance = require("../../db/knexInstance");
const logger = require("../../utils/logger.js");
const EmailUtils = require("../../utils/emailUtils.js");
const UserUtils = require("../../utils/userUtils.js");
const UUID = require('uuid');
const IoService = require("../io/ioService");


const INDEX_WORKFLOWS = "workflows";
const WORKFLOW_PATH = "/o/";    // i.e. 'host.com/o/workflow_id'

/***************************************************************
 * Create a new workflow.
 *
 *   IO Service middleware with business logic for creating a
 *   new workflow record.
 *    - Confirms logged in user
 *    - Checks permissions (TODO)
 *    - Retrieves or creates a new user based on email
 *    - Creates a new workflow record
 *    - Emails the target user a link to the new workflow record
 *
 *    Route: /io?index=workflows
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 ***************************************************************/
exports.createWorkflow = async (req, res, next) => {
  // console.log("[WorkflowService] createWorkflow()");
  if (req.query?.index !== INDEX_WORKFLOWS || UUID.validate(req.body.id)) {
    return next();
  }

  // console.log("[WorkflowService] createWorkflow(): Creating workflow");

  let msg = '';

  const json_data = req.body;
  delete json_data["_csrf"];
  const index = INDEX_WORKFLOWS;



  // Security
  // 1. Get current user
  const createdBy = req.user?.id;
  // 2. Verify user has role/privilege to create a workflow
  // 3. Set 'json_data.createdBy = user.id'
  json_data.createdBy = createdBy;


  // Target User
  // 1. Get target user by json_data.email
  const targetEmail = json_data.email;
  // 2. If they exist, good.
  // 3. If they don't exist, create a user record with just the email address
  //    - const newUser = true;

  let userId = await UserUtils.getUserIdByEmail(targetEmail);

  if (!userId) {
    userId = await UserUtils.createUser({email: targetEmail});
  }

  // Process
  // 1. Create workflow record
  json_data.id = UUID.v4();
  json_data.status = "invited";
  json_data.userId = userId;

  const workflowId = await IoService.insertUpdate(json_data, index).then((result) => {
    // console.log("Created workflow result: ", result);
    return result[0].id;
  }).catch((e) => {
    console.log(e);
    return e;
  });

  if (!workflowId) {
    msg = "Unable to create workflow...";
    console.log(msg, workflowId);
    return res.send(msg);
  }

  // 2. if (newUser) {
  //     Send email invite to sign up
  //    } else {
  //      Send email invite to workflow
  //     }

  const mailOptions = {
    to: targetEmail,
    subject: 'Action Required: Onboarding Workflow Now Available',
    text: 'Congratulations! You are now ready to start the onboarding process.\n\n' +
      'Please click on the following link or paste it into your browser to complete the onboarding process:\n\n' +
      process.env.HOST + WORKFLOW_PATH + workflowId + '\n\n'
  };

  const emailResult = await EmailUtils.sendEmail(mailOptions).then((msg) => {
    console.log("Onboarding email sent... " + msg);
    return msg;
  }).catch((e) => {
    console.log("ERROR - Onboarding email NOT sent... ", e);
    return e;
  });


  // console.log("emailResult = ", emailResult);

  // Response
  // if success {
  // res.send(`An invitation has been sent to ${json_data.email}`)
  // } else {
  // res.send(`An error occurred`);
  // }

  if (emailResult) {
    return res.send("New workflow invitation email sent.");   // Success
  } else {
    return res.send("Workflow created, but invitation email not sent.");     // Error
  }



  console.log("[WorkflowService] createWorkflow(): ERROR - Unable to complete process");
  return next();
}


/**
 * Delete an existing object with the specified ID (from the body)
 *
 * id UUID
 * index String Type of record. This resolves to the table to delete from. Defaults to 'io' table. (optional)
 * returns String
 **/
exports.deleteObject = function(id,index) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Retrieve an existing record by UUID (id).
 *
 * index String Type of record. This resolves to the table to retrieve from. Defaults to 'io' table.
 * id String UUID of object to retrieve. Defaults to 'io'.
 * returns List
 **/
exports.getById = function(index = 'io', id) {
  return knexInstance(index)
    .where({"id": id})
    .select('json_data')
    .then((res) => {
      console.log("[IoService] getById() = ", res);
      return normalizeData(res)[0] || {};
    });
}


/**
 * Retrieve an existing record by ID (as a URL parameter).
 *
 * index String Type of record. This resolves to the table to retrieve from. Defaults to 'io' table.
 * id String UUID of object to retrieve.
 * returns List
 **/
exports.getByIdFromPath = function(index,id) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ "", "" ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Update an existing record or insert a new record based on UUID.
 *
 * body IOObj The keys and values to be patched
 * index String Type of record. This resolves to the table to insert into. Defaults to 'io' table. (optional)
 * returns String
 **/
exports.insertUpdate = function(body,index) {
  logger.info(`[IoService] insertUpdate(${index}): ID to insert/update: ${body.id}`
  )

  const data = body;    // json_data

  return knexInstance(index)
    .where({ id: data.id })
    .select("id")
    .then(async (results) => {
      console.log("[IoService] insertUpdate(): Existing records with ID: ", results);
      if (results.length >= 1) {
        console.log("UPDATE: ", data);
        return knexInstance(index)
          .returning('id')
          .where({ id: data.id })
          .update('json_data', data)
          .then((result) => {return result})
          .catch((e) => {
            console.log(e);
          });
      } else {
        console.log("INSERT: ", data);
        return knexInstance(index)
          .returning('id')
          .insert({ id: data.id, json_data: data })
          .then((result, ) => {return result})
          .catch((e) => {
            console.log(e);
          });
      }
    })
}

const isDataValid = (index, id) => {

  return true;
}


/************************************************
 * Normalize data
 *
 *  Adds db server columns created_at and updated_at
 *  to json_data.
 *
 * @param resultSet
 * @returns {*[]}
 * ************************************************/
const normalizeData = (resultSet) => {
  let resultArray = [];
  if (resultSet?.length < 0) {
    resultArray.push(resultSet);
  } else {
    resultArray = resultSet;
  }

  for (let i=0; i < resultArray?.length; i++) {
    const result = resultArray[i];
    if (!result.json_data) {
      result.json_data = {};
    }
    if (result.created_at) {
      result.json_data.created_at = result.created_at;
    }
    if (result.updated_at) {
      result.json_data.updated_at = result.updated_at;
    }
  }

  return resultArray;
}
