let ensureLogIn = require('connect-ensure-login').ensureLoggedIn;

getLogInFunc = (req, res, next) => {
  console.log("[routerUtils] getLogInFunc(): BYPASS_AUTH = ", process.env.BYPASS_AUTH, " & process.env.NODE_ENV = ", process.env.NODE_ENV);
  console.log("NODE_ENV = ", process.env.NODE_ENV);
  if (process.env.BYPASS_AUTH === "true") {
    return () => {
      return function (req, res, next) {
        next();
      }
    }
  } else if (process.env.SERVER_SIDE_AUTH !== "true") {
    return () => {
      return function (req, res, next) {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
          const errorResponse = {
            status: 403,
            msgCode: "FORBIDDEN",
            message: "You must be signed in to access this resource."
          };
          res.status(errorResponse.status);
          res.send(errorResponse);
          return;
        }
        next();
      }
    }
  } else {
    console.log("Verifying authentication")
    return ensureLogIn;
  }
}

const setTestUser = (req, res, next) => {
  console.log("setTestUser()");
  const config = {};
  config.user = {};
  let configString = "";
  try {
    req.user = {
      id: 'xyz',
      name: 'usermon',
      username: 'anonymous'
    }
    config.user = {
      id: req.user.id,
      name: req.user.name,
      username: req.user.username
    };
    configString = JSON.stringify(config);
    res.locals.config = configString;
  } catch (e) {
    console.log(e);
  }
  console.log("setTestUser(): Complete");
  next();
}

const checkUser = (req, res, next) => {
  if (!req.user) {
    if (process.env.TESTMODE === "true") {
      setTestUser(req, res, next);
    } else {
      console.log("REDIRECTING to login: req.session.returnTo = ", req.session.returnTo);
      return res.render('login', {title: process.env.TITLE});
    }
  }
}

class ErrorResponse {
  constructor(name, code, description, errors, errorMap) {
    this.name = name ?? "Error";
    this.code = code ?? "";
    this.description = description ?? "";
    this.errors = errors || [];
    this.errorMap = errorMap || {};
  }
}

class GenericResponse {
  constructor(name, code, description, msgs) {
    this.name = name ?? "Success";
    this.code = code ?? "";
    this.description = description ?? "";
    this.msgs = msgs || [];
  }
}

// TODO: Export additional methods
module.exports = {
  ensureLogIn: getLogInFunc(),
  getLogInFunc: getLogInFunc(),
  ErrorResponse: ErrorResponse,
  GenericResponse: GenericResponse
}

