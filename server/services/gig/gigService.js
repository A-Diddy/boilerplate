'use strict';
const knexInstance = require("../../db/knexInstance");
const logger = require("../../utils/logger.js");
const EmailUtils = require("../../utils/emailUtils.js");
const UserUtils = require("../../utils/userUtils.js");
const UUID = require('uuid');
const IoService = require("../io/ioService");
const ejs = require("ejs");

const INDEX = "reqs";
const GIG_PATH = "/gig/";    // i.e. 'host.com/gig/gig_id/gig_step'

/***************************************************************
 * Create a new gig.
 *
 *   IO Service middleware with business logic for creating a
 *   new gig record.
 *    - Confirms logged in user
 *    - Checks permissions (TODO)
 *    - Creates a new gig record
 *    - Sends notifications to any new approvers
 *
 *    Route: /io?index=gigs
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 ***************************************************************/
exports.createGig = async (req, res, next) => {
  // console.log("[GigService] createGig()");
  if (req.query?.index !== INDEX) {
    return next();
  }

  const json_data = req.body || {};   // gig object

  // Main Logic
  // 1. Get existing record
  const existingRec = await IoService.getById(INDEX, json_data.id)
    .then((results) => {
      // console.log("Got existing records: ", results);
      return results.json_data ? results.json_data : {};
    });

  // 2. Send update notifications
  if (json_data.approvalDetails?.sendNewApproverNotifications) {
    this.sendEmailsToApprovers(json_data, existingRec); // No need to wait... emails can be sent while response processes
  }

  // 3. If record already exists, jump to updateGig()
  if (existingRec.id === json_data.id) {
    return this.updateGig(req, res, next);
  }

  // 4. Else, Process new record
  console.log("[GigService] createGig(): Creating gig");

  // Security
  // 1. Get current user

  // 2. Verify user has role/privilege to create a gig

  // 3. Set 'json_data.createdBy = user.id'
  req.body.createdBy = req.user?.id;
  return next();
}

exports.updateGig = (req, res, next) => {
  console.log("[GigService] updateGig()");

  // Security
  req.body.updatedBy = req.user?.id;

  return next();
}

/**********************************************************
 * Gets newly added and existing approvers (UNION and DIFF sets)
 *
 *   Given two sets of approvers (old vs new), will compare the
 *   approverIds to determine the following sets:
 *    - Existing approvers (union)
 *    - Newly added approvers (diff: new - old)
 *    - [FUTURE_ENHANCEMENT]: Removed approvers
 *
 *    Returns an object with the two sets:
 *    {newly, existing}
 *
 * @param prevApprovers
 * @param newApprovers
 * @returns {{newly: [], existing: []}}
 **********************************************************/
exports.getApproverSets = (prevApprovers, newApprovers) => {
  const existing = [];
  const newly = newApprovers.filter((newApproval) => {
    let isNew = true;
    for (let i = 0; i < prevApprovers.length; i++) {
      if (prevApprovers[i].approverId === newApproval.approverId) {
        isNew = false;
        existing.push(prevApprovers[i]);
        break;
      }
    }
    return isNew;
  });
  // console.log("getApproverSets(): Result = ", {newly, existing});
  return {newly, existing};
}


exports.sendEmailsToApprovers = async (newGig, oldGig) => {
  // console.log("sendEmailsToApprovers(", {newGig, oldGig}, ")")
  if (!newGig?.gigDetails || newGig?.approvalDetails?.approvers?.length <= 0) {
    // No gig details or no approvers, do nothing.
    return Promise.resolve("No emails sent.");
  }

  const approvals = newGig.approvalDetails.approvers;

  if (!oldGig.id) {
    // This is a new gig, send each approver a "newApprover" email and return.
    return this.sendEmailsForNewApprovers(newGig, approvals);
  }

  // This is an update to an existing gig, determine which approvers to notify

  const {newly, existing} = this.getApproverSets(oldGig.approvalDetails.approvers, newGig.approvalDetails.approvers);
  // console.log("newlyAddedApprovers = ", newly);
  // console.log("existingApprovers = ", existing);

  const promises = [];
  // 1. Find any newly added approvers
  promises.push(this.sendEmailsForAddedApprovers(newGig, newly));

  // TODO: Remove the following line... it's for testing only
  // newGig.approvalDetails.notifications = {sendExistingApproverNotifications: true};

  // 2. Send a "gigEdit" email to the other, existing approvers
  if (newGig.approvalDetails.notifications?.sendExistingApproverNotifications) {
    promises.push(this.sendEmailsForExistingApprovers(newGig, existing));
  }

  return Promise.all(promises);
}

exports.sendEmailsForAddedApprovers = async (gig, approvals = []) => {
  // console.log("sendEmailsForAddedApprovers(", {gig, approvals}, ")")
  if (!gig?.gigDetails || approvals.length <= 0) {
    return Promise.resolve("No emails sent.");
  }

  const users = await this.getUsersFromApprovers(approvals);
  const promises = [];    // Collect each email send promise

  try {
    users.forEach((user) => {
      promises.push(this.sendApproverEmail(gig, user, "add"));
    })
  } catch (e) {
    logger.error(e);
  }

  return Promise.all(promises);
}

exports.sendEmailsForNewApprovers = async (gig, approvals = []) => {
  // console.log("sendEmailsForNewApprovers(", {gig, approvals}, ")")
  if (!gig?.gigDetails || approvals.length <= 0) {
    return Promise.resolve("No emails sent.");
  }

  const users = await this.getUsersFromApprovers(approvals);
  const promises = [];

  try {
    users.forEach((user) => {
      promises.push(this.sendApproverEmail(gig, user, "new"));
    })
  } catch (e) {
    loger.error(e);
  }

  return Promise.all(promises);
}

exports.getUsersFromApprovers = (approvals) => {
  if (approvals?.length <= 0) {
    return Promise.resolve([]);
  }
  // Get email addresses for each user...
  // const emailAddresses = {};
  const approverIds = [];
  approvals.forEach((approval) => {
    approverIds.push(approval.approverId);
  });

  return knexInstance("users").whereIn("id", approverIds);
}

exports.sendEmailsForExistingApprovers = async (gig, approvals) => {
  // console.log("sendEmailsForExistingApprovers(", {gig, approvals}, ")");
  const users = await this.getUsersFromApprovers(approvals);
  const promises = [];
  try {
    users.forEach((user) => {
      promises.push(this.sendApproverEmail(gig, user, "edit"));
    })
  } catch (e) {
    logger.error(e);
  }

  return Promise.all(promises);
}

/*************************************************
 * Send approver emails
 *
 *  Given a gig and a user object, will send a specific
 *  type of email to the approver.
 *
 * @param gig: Gig object of the email to send.
 * @param user: User object of the target recipient.
 * @param {string} type: "add", "edit", "new" (default).
 * @param {string} template: [OPTIONAL] Override the template file ot use.
 * @returns {Promise<string>}: Promise to the email transfer.
 *************************************************/
exports.sendApproverEmail = async (gig, user, type, template = null) => {
  // console.log("[GigService] sendApproverEmail(",{gig, user, type, template},")");

  const gigLink = process.env.HOST + GIG_PATH + gig.id;
  const emailTemplatePath = "/"
  let subject = `[Approval Requested]`;

  if (template) {
    type = "custom";
  }

  switch(type) {
    case "add":
      template = "email_AddedApprover.ejs";
      subject += ` Requisite: ${gig.gigDetails.title || ""}`;
      break;
    case "edit":
      template = "email_gigEdit.ejs";
      subject += ` Requisite Modified: ${gig.gigDetails.title || ""}`;
      break;
    case "custom":
      subject += `${gig.gigDetails.title}`
      break;
    default:
      // New
      template = "email_newApprover.ejs";
      subject += ` New Requisite: ${gig.gigDetails.title || ""}`;
  }

  // Get email contents from template
  const emailText = await ejs.renderFile(__dirname + emailTemplatePath + template, {
    title: process.env.TITLE,
    gig: gig,
    user: user,
    gigLink: gigLink
  });

  // Construct mail options
  const mailOptions = {
    to: user.email,
    subject: subject,
    html: emailText
  };

  // Send email and return promise
  logger.info(`Sending Email- TO: ${mailOptions.to} - Subject: ${mailOptions.subject}`);
  return EmailUtils.sendEmail(mailOptions)
    .then((msg) => {
      // console.log("Gig approver email sent... " + msg);
      return msg;
    }).catch((e) => {
      logger.error("ERROR - Gig approver email NOT sent... ", e);
      return e;
    })
}

exports.sendEmailsForRemovedApprovers = (approvals) => {

}
