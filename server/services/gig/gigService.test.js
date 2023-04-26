const knexInstance = require("../../db/knexInstance");
const GigService = require("./GigService.js");
// const describe = require("jest");

describe('Gig Service', () => {
  test(' sendEmailsForNewApprovers(): handles empty data', async () => {
    const gig = {};
    const approvals = [];
    const result = await GigService.sendEmailsForNewApprovers(gig, approvals);
    console.log("result = ", result);
    expect(result.length).toBeGreaterThan(0);
  });

  test(' sendEmailsForNewApprovers(): sends emails for new approvers', async () => {
    const gig = {"id": "25c7d288-a79f-4f7d-9826-406bd4e2a926", "status": "Pending Approval", "userId": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "gigDetails": {"title": "asdf", "status": "Open", "expLevel": "Any"}, "payDetails": {"payAmt": 0, "payCurrency": "$ USD", "supervisors": []}, "approvalDetails": {"approvers": [{"id": "f76f19cb-9bdf-45be-bb8a-9b85e5e9cb4d", "name": "asDZF", "type": "NewGig", "_csrf": "keVuRnJ3-3m1eQ-GXzNGEOO3jRiVDQ72_xQY", "status": "Pending", "created": 1675730687852, "creator": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "approver": "Austin Stuart", "parentId": "25c7d288-a79f-4f7d-9826-406bd4e2a926", "approverId": "8e3c8819-6b89-4c84-b558-cca9aed600c3"}]}, "employeeDetails": {"phone": ""}};
    const approvals = [{"id": "f76f19cb-9bdf-45be-bb8a-9b85e5e9cb4d", "name": "asDZF", "type": "NewGig", "_csrf": "keVuRnJ3-3m1eQ-GXzNGEOO3jRiVDQ72_xQY", "status": "Pending", "created": 1675730687852, "creator": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "approver": "Austin Stuart", "parentId": "25c7d288-a79f-4f7d-9826-406bd4e2a926", "approverId": "8e3c8819-6b89-4c84-b558-cca9aed600c3"}];
    const result = await GigService.sendEmailsForNewApprovers(gig, approvals);
    console.log("result = ", result);
    expect(result.length).toBeGreaterThan(0);
  });

  test(' createGig(): creates gigs', async () => {
    const userId = "050394cd-dbcd-4b30-9f0a-e2d70d1b956e";
    const gig = {"id": "25c7d288-a79f-4f7d-9826-406bd4e2a922", "status": "Pending Approval", "userId": userId, "gigDetails": {"title": "asdf", "status": "Open", "expLevel": "Any"}, "payDetails": {"payAmt": 0, "payCurrency": "$ USD", "supervisors": []}, "approvalDetails": {"approvers": [{"id": "f76f19cb-9bdf-45be-bb8a-9b85e5e9cb4d", "name": "asDZF", "type": "NewGig", "_csrf": "keVuRnJ3-3m1eQ-GXzNGEOO3jRiVDQ72_xQY", "status": "Pending", "created": 1675730687852, "creator": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "approver": "Austin Stuart", "parentId": "25c7d288-a79f-4f7d-9826-406bd4e2a926", "approverId": "8e3c8819-6b89-4c84-b558-cca9aed600c3"}]}, "employeeDetails": {"phone": ""},
      sendNewApproverNotifications: true};
    const approvals = [{"id": "f76f19cb-9bdf-45be-bb8a-9b85e5e9cb4d", "name": "asDZF", "type": "NewGig", "_csrf": "keVuRnJ3-3m1eQ-GXzNGEOO3jRiVDQ72_xQY", "status": "Pending", "created": 1675730687852, "creator": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "approver": "Austin Stuart", "parentId": "25c7d288-a79f-4f7d-9826-406bd4e2a926", "approverId": "8e3c8819-6b89-4c84-b558-cca9aed600c3"}];
    const next = () => {return "next() called"};
    const req = {body: gig, query:{index: "reqs"}, user: {id: userId}, notifications: {sendNewApproverNotifications: true}};
    const res = {};
    const result = await GigService.createGig(req, res, next);
    console.log("result = ", result);
    expect(result.length).toBeGreaterThan(0);
  });

  test(' createGig(): updates gigs', async () => {
    const userId = "050394cd-dbcd-4b30-9f0a-e2d70d1b956e";
    const gig = {"id": "e4c84568-1dc6-419c-a58a-d008a0653584", "status": "Pending Approval", "userId": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "createdBy": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "gigDetails": {"title": "New Gigzz", "status": "Open", "expLevel": "Any"}, "payDetails": {"payAmt": 0, "payCurrency": "$ USD", "supervisors": []}, "approvalDetails": {"approvers": [{"id": "f1f03ec7-9a52-4308-9963-beafe3ac9dc3", "type": "NewGig", "status": "Pending", "created": 1676430710135, "creator": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "dueDate": "2023-02-17", "approver": "Barbara", "parentId": "e4c84568-1dc6-419c-a58a-d008a0653584", "approverId": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e"}], "sendNewApproverNotifications": true}, "employeeDetails": {"phone": ""}};
    const approvals = gig.approvalDetails.approvers;
    const next = () => {return "next() called"};
    const req = {body: gig, query:{index: "reqs"}, user: {id: userId}, notifications: {sendNewApproverNotifications: true}};
    const res = {};
    const result = await GigService.createGig(req, res, next);
    console.log("result = ", result);
    expect(result.length).toBeGreaterThan(0);
  });
/*

  test(' getNewlyAddedApprovers(): gets newly added approvers', async () => {
    const prevApprovers = [{"id": "f76f19cb-9bdf-45be-bb8a-9b85e5e9cb4d", "name": "asDZF", "type": "NewGig", "_csrf": "keVuRnJ3-3m1eQ-GXzNGEOO3jRiVDQ72_xQY", "status": "Pending", "created": 1675730687852, "creator": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "approver": "Austin Stuart", "parentId": "25c7d288-a79f-4f7d-9826-406bd4e2a926", "approverId": "8e3c8819-6b89-4c84-b558-cca9aed600c3"}];

    const newApprovals = [{"id": "f76f19cb-9bdf-45be-bb8a-9b85e5e9cb4d", "name": "asDZF", "type": "NewGig", "_csrf": "keVuRnJ3-3m1eQ-GXzNGEOO3jRiVDQ72_xQY", "status": "Pending", "created": 1675730687852, "creator": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "approver": "Austin Stuart", "parentId": "25c7d288-a79f-4f7d-9826-406bd4e2a926", "approverId": "8e3c8819-6b89-4c84-b558-cca9aed600c2"}];

    const result1 = await GigService.getNewlyAddedApprovers(prevApprovers, newApprovals);
    expect(result1.length).toBeGreaterThan(0);

    const result2 = await GigService.getNewlyAddedApprovers(prevApprovers, prevApprovers);
    expect(result2.length).toBe(0);
  });
*/

  test(' getApproverSets(): gets diff and union of old and new approvers', async () => {
    const prevApprovers = [{"id": "f76f19cb-9bdf-45be-bb8a-9b85e5e9cb4d", "name": "asDZF", "type": "NewGig", "_csrf": "keVuRnJ3-3m1eQ-GXzNGEOO3jRiVDQ72_xQY", "status": "Pending", "created": 1675730687852, "creator": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "approver": "Austin Stuart", "parentId": "25c7d288-a79f-4f7d-9826-406bd4e2a926", "approverId": "8e3c8819-6b89-4c84-b558-cca9aed600c3"}];

    const newApprovers = [{"id": "f76f19cb-9bdf-45be-bb8a-9b85e5e9cb4d", "name": "asDZF", "type": "NewGig", "_csrf": "keVuRnJ3-3m1eQ-GXzNGEOO3jRiVDQ72_xQY", "status": "Pending", "created": 1675730687852, "creator": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "approver": "Austin Stuart", "parentId": "25c7d288-a79f-4f7d-9826-406bd4e2a926", "approverId": "8e3c8819-6b89-4c84-b558-cca9aed600c3"}, {"id": "f76f19cb-9bdf-45be-bb8a-9b85e5e9cb4d", "name": "asDZF", "type": "NewGig", "_csrf": "keVuRnJ3-3m1eQ-GXzNGEOO3jRiVDQ72_xQY", "status": "Pending", "created": 1675730687852, "creator": "050394cd-dbcd-4b30-9f0a-e2d70d1b956e", "approver": "Austin Stuart", "parentId": "25c7d288-a79f-4f7d-9826-406bd4e2a926", "approverId": "8e3c8819-6b89-4c84-b558-cca9aed600c2"}];

    const {newly, existing} = GigService.getApproverSets(prevApprovers, newApprovers);
    // console.log("result = ", {newly, existing});
    expect(existing.length).toBeGreaterThan(0);
    expect(newly .length).toBeGreaterThan(0);

    // const result2 = await GigService.getExistingApprovers(prevApprovers, prevApprovers);
    // expect(result2.length).toBe(0);
  });
});

