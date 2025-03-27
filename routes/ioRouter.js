require('dotenv').config();
const express = require('express');
// const IoRouter = require("../server/models/IO");
const IoService = require("../server/services/io/ioService");
const WorkflowService = require("../server/services/workflow/workflowService");
const GigService = require("../server/services/gig/gigService");
const UUID = require("uuid");

// const cors = require("cors");

// const ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLogIn = require('./routerUtils').ensureLogIn;
const logger = require("../server/utils/logger");
const AuthService = require("../server/services/auth/authService");

const router = express.Router();
const ensureLoggedIn = ensureLogIn({redirectTo: '/login', returnTo: '/io'});
//
// function fetchTodos(req, res, next) {
//   // console.log("fetchTodos(",{req, res, next},")");
//   console.log("fetchTodos(req.user = ",req.user,")");
//   db.all('SELECT * FROM todos WHERE owner_id = ?', [
//     req.user.id
//   ], function(err, rows) {
//     if (err) { return next(err); }
//
//     var todos = rows.map(function(row) {
//       return {
//         id: row.id,
//         title: row.title,
//         completed: row.completed == 1 ? true : false,
//         url: '/' + row.id
//       }
//     });
//     res.locals.todos = todos;
//     res.locals.activeCount = todos.filter(function(todo) { return !todo.completed; }).length;
//     res.locals.completedCount = todos.length - res.locals.activeCount;
//     next();
//   });
// }
//
// const fetchBaseConfig = (req, res, next) => {
//   const config = {};
//   let configString = "";
//
//   try {
//     // TODO: Fetch config for req.user.id from DB
//
//
//     configString = JSON.stringify(config);
//   } catch (e) {
//     console.log("e");
//     next(e)
//   }
//
//   // Add the config string to the 'res.locals' object, making it available to the templates
//   res.locals.config = configString;
//   next();
// }

const getPrivs = (req, res, next) => {
  // TODO: Get and set user access privileges

  next();
};

// Each request will route through here first...
router.use(
  // Add CORS Headers
  (req, res, next) => {
    logger.info(`[IORouter] ${req.ip} -> ${req.method} ${req.originalUrl} = ${res.status}`);
    // console.log("Request origin: ", req.header(origin));
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With ,x-csrf-token, authorization,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
  },
  ensureLoggedIn,     // SERVER_SIDE_AUTH=true: Redirects for local auth. Otherwise, returns JSON response
  getPrivs
);

const processQuery = (index, id) => {
  // TODO
}

/************************************************
 * Validate incoming data.
 *
 *  Tests that incoming requests have the following:
 *   - index
 *   - id (valid UUID)
 *
 * @param req
 * @param res
 * @param next
 ************************************************/
const validateData = (req, res, next) => {
  // Check for valid index and id in URL params or query string
  let index = req.params.index || req.query.index;
  let id = req.params.id || req.query.id;

  if (!index) {
    const msgCode = "ERROR";
    const msg = "'index' (table) not specified.";
    console.log("[ioRouter] validateData(", index, ", ", id, "): ", msgCode, " - ", msg, "... exiting");
    const errorResponse = {
      msgCode: msgCode,
      message: msg
    };
    res.send(errorResponse);
    return;
  }
  if (!id) {
    const msgCode = "ERROR";
    const msg = "'id' (UUID) not specified";
    console.log("[ioRouter] validateData(", index, ", ", id, "): ", msgCode, " - ", msg, "... exiting");
    const errorResponse = {
      msgCode: msgCode,
      message: msg
    };
    res.send(errorResponse);
    return;
  }
  if (!UUID.validate(id)) {
    const msgCode = "ERROR";
    const msg = "'id' is not a valid UUID";
    console.log("[ioRouter] validateData(", index, ", ", id, "): ", msgCode, " - ", msg, "... exiting");
    const errorResponse = {
      msgCode: msgCode,
      message: msg
    };
    res.send(errorResponse);
    return;
  }

  next();
}

// router.options('/', cors());

/******************************************************
 * Get single result by record type/table (index)
 * and UUID... passed in as URL parameters.
 *
 *   Example: host:port/io/users/123e4567-e89b-12d3-a456-426614174000
 ******************************************************/
router.get('/:index/:id', validateData, AuthService.hasPriv(), (req, res, next) => {
  // FUTURE_ENHANCEMENT: Privilege Authorization
  IoService.getById(req.params?.index, req.params?.id).then((result) => {
    res.send(result);
  }).catch((e) => {
    console.log(e);
    res.send(e);
  });
});

/******************************************************
 * Get single result by record type/table (index)
 * and UUID... passed in the query string.
 *
 *   Example: host:port/io?index=users&id=123e4567-e89b-12d3-a456-426614174000
 ******************************************************/
router.get('/', AuthService.hasPriv(), (req, res, next) => {
  // TODO: Consolidate this convenience route with the one above
  // FUTURE_ENHANCEMENT: Privilege Authorization
  IoService.getById(req.query?.index, req.query?.id).then((result) => {
    res.send(result);
  }).catch((e) => {
    console.log(e);
    res.send(e);
  });
});

/******************************************************
 * [/io?index=""] Insert or update record
 *
 * ******************************************************/
router.post('/',
  // --------------- CUSTOM OBJECT LOGIC -----------------
  WorkflowService.createWorkflow,     // Business Logic: "workflows"
  GigService.createGig,               // Business Logic: "reqs"
  // -----------------------------------------------------
  function (req, res, next) {
    console.log("/io - POST. Request Contents: ", req.params, req.body, req.query);

    try {
      const index = req.query?.index;
      const json_data = req.body;
      delete json_data["_csrf"];

      json_data.id = json_data.id || UUID.v4();   // TODO: Call validateData() in processing chain

      IoService.insertUpdate(json_data, index, req.user.id).then((result) => {
        res.send(result);
      }).catch((e) => {
        console.log(e);
        res.send(e);
      });
    } catch (e) {
      console.log(e);
    }
  });

module.exports = router;
