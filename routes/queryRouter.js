require('dotenv').config();
const express = require('express');
// const ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLogIn = require('./routerUtils').ensureLogIn;
const QueryService = require("../server/services/query/QueryService");

const router = express.Router();
const ensureLoggedIn = ensureLogIn({ redirectTo: '/login', returnTo: '/' });

const getPrivs = (req, res, next) => {
  // TODO: Get and set user access privileges

  next();
};

// Each request will route through here first...
router.use(
  (req, res, next) => {
    console.log("[Query] request received: ", req.ip);
    // console.log("Request origin: ", req.header(origin));
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,x-csrf-token,authorization,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    if (process.env.TESTMODE === "true") {
      // Bypass authentication
      return next();
    }
    ensureLoggedIn(req, res, next);
  },
  // ensureLoggedIn,        // TODO: Need this
  getPrivs
);

// TODO: Move this to routerUtils...

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
  console.log("checkUser");
  if (!req.user) {
    if (process.env.TESTMODE === "true") {
      setTestUser(req, res, next);
    } else {
      // TODO: POST requests should get a message and 403 (forbidden) response... not a redirect
      console.log("REDIRECTING to login: req.session.returnTo = ", req.session.returnTo);
      return res.render('login', {title: process.env.TITLE});
    }
  } else {
    next();
  }
}


router.post('/', checkUser, function (req, res, next) {

  QueryService.query(req.body, req.query.index, req.query.limit, req.query.offset)
    .then( (result) => {
      console.log("[/q] query(): ", result);
      res.send(result);
    })
    .catch( (e) => {
      res.send(e);
    });
});

//
// router.get('/active', ensureLoggedIn, fetchTodos, function(req, res, next) {
//   res.locals.todos = res.locals.todos.filter(function(todo) { return !todo.completed; });
//   res.locals.filter = 'active';
//   res.render('index', { user: req.user, title: process.env.TITLE });
// });
//
// router.get('/completed', ensureLoggedIn, fetchTodos, function(req, res, next) {
//   res.locals.todos = res.locals.todos.filter(function(todo) { return todo.completed; });
//   res.locals.filter = 'completed';
//   res.render('index', { user: req.user, title: process.env.TITLE  });
// });
//
// router.post('/', ensureLoggedIn, function(req, res, next) {
//   req.body.title = req.body.title.trim();
//   next();
// }, function(req, res, next) {
//   if (req.body.title !== '') { return next(); }
//   return res.redirect('/' + (req.body.filter || ''));
// }, function(req, res, next) {
//   db.run('INSERT INTO todos (owner_id, title, completed) VALUES (?, ?, ?)', [
//     req.user.id,
//     req.body.title,
//     req.body.completed == true ? 1 : null
//   ], function(err) {
//     if (err) { return next(err); }
//     return res.redirect('/' + (req.body.filter || ''));
//   });
// });
//
// router.post('/:id(\\d+)', ensureLoggedIn, function(req, res, next) {
//   req.body.title = req.body.title.trim();
//   next();
// }, function(req, res, next) {
//   if (req.body.title !== '') { return next(); }
//   db.run('DELETE FROM todos WHERE id = ? AND owner_id = ?', [
//     req.params.id,
//     req.user.id
//   ], function(err) {
//     if (err) { return next(err); }
//     return res.redirect('/' + (req.body.filter || ''));
//   });
// }, function(req, res, next) {
//   db.run('UPDATE todos SET title = ?, completed = ? WHERE id = ? AND owner_id = ?', [
//     req.body.title,
//     req.body.completed !== undefined ? 1 : null,
//     req.params.id,
//     req.user.id
//   ], function(err) {
//     if (err) { return next(err); }
//     return res.redirect('/' + (req.body.filter || ''));
//   });
// });
//
// router.post('/:id(\\d+)/delete', ensureLoggedIn, function(req, res, next) {
//   db.run('DELETE FROM todos WHERE id = ? AND owner_id = ?', [
//     req.params.id,
//     req.user.id
//   ], function(err) {
//     if (err) { return next(err); }
//     return res.redirect('/' + (req.body.filter || ''));
//   });
// });
//
// router.post('/toggle-all', ensureLoggedIn, function(req, res, next) {
//   db.run('UPDATE todos SET completed = ? WHERE owner_id = ?', [
//     req.body.completed !== undefined ? 1 : null,
//     req.user.id
//   ], function(err) {
//     if (err) { return next(err); }
//     return res.redirect('/' + (req.body.filter || ''));
//   });
// });
//
// router.post('/clear-completed', ensureLoggedIn, function(req, res, next) {
//   db.run('DELETE FROM todos WHERE owner_id = ? AND completed = ?', [
//     req.user.id,
//     1
//   ], function(err) {
//     if (err) { return next(err); }
//     return res.redirect('/' + (req.body.filter || ''));
//   });
// });

module.exports = router;
