let ensureLogIn = require('connect-ensure-login').ensureLoggedIn;

getLogInFunc = () => {
  if (process.env.BYPASS_AUTH === "true") {
    return () => {
      return function (req, res, next) {
        next();
      }
    }
  } else {
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
      username: 'usernamemon'
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


// TODO: Export additional methods
module.exports = getLogInFunc();

