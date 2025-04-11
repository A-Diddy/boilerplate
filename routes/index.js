require('dotenv').config();
var express = require('express');
const ensureLogIn = require('./routerUtils').ensureLogIn;
// var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var path = require('path');
var db = require('../db');
const IoService = require("../server/services/io/ioService");
const logger = require("../server/utils/logger");

var router = express.Router();
var ensureLoggedIn = ensureLogIn();

function fetchTodos(req, res, next) {
  db.all('SELECT * FROM todos WHERE owner_id = ?', [
    req.user.id
  ], function(err, rows) {
    if (err) { return next(err); }
    
    var todos = rows.map(function(row) {
      return {
        id: row.id,
        title: row.title,
        completed: row.completed == 1 ? true : false,
        url: '/' + row.id
      }
    });
    res.locals.todos = todos;
    res.locals.activeCount = todos.filter(function(todo) { return !todo.completed; }).length;
    res.locals.completedCount = todos.length - res.locals.activeCount;
    next();
  });
}

const fetchBaseConfig = (req, res, next) => {
  const config = {};
  let configString = "";

  try {
    // Add user data from request object (derived from session cookie)
    config.user = {
      id: 'xyz',
      name: 'usermon',
      username: 'usernamemon'
    };

    if (req.user?.id) {
      console.log("Using user from request");
      config.user = {
        id: req.user.id,
        name: req.user.name,
        username: req.user.username
      };
    }

    configString = JSON.stringify(config);
  } catch (e) {
    console.log("e");
    next(e)
  }

  // Add the config string to the 'res.locals' object, making it available to the templates
  res.locals.config = configString;
  next();
}

router.use((req, res, next) => {
  // logger.info(`[IndexRouter] ${req.ip} -> ${req.method} ${req.originalUrl}`);
  console.log(`[IndexRouter] ${req.ip} -> ${req.method} ${req.originalUrl}`);
  next();
})

/* GET home page. */
router.get('/',
  // TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // TODO: use routerUtils.checkUser() instead of this.
  // TODO: Enable app access without authentication...
  // TODO: Define which specific routes need authentication instead
  // TODO: If user is not logged in, no user exists, so we need to ensure a dummy username is available... or the template bombs.
  // TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  function(req, res, next) {

  console.log("[index] GET '/': Processing request..........");
  if (!req.user) {
    // TODO!!: This should not render the login page if 'SERVER_SIDE_AUTH' is false. Instead, the request should pass to the
    //  next handler (and eventually to the client app).
    if (process.env['SERVER_SIDE_AUTH']?.toLowerCase() === 'true') {
      req.session.returnTo = req.path;    // TODO: [Austin] 2025-04-01: Test this line
      return res.render('login', {title: process.env.TITLE});
    }
  }
  next();
},
  fetchBaseConfig,
  function(req, res, next) {
  res.locals.filter = null;  // Used in the rendered `index.ejs` template
  res.render(path.join(__dirname, '../clientApp/dist/index'), { user: req.user, title: process.env.TITLE });
});




/*

router.get('/active', ensureLoggedIn, fetchTodos, function(req, res, next) {
  res.locals.todos = res.locals.todos.filter(function(todo) { return !todo.completed; });
  res.locals.filter = 'active';
  res.render('index', { user: req.user, title: process.env.TITLE });
});

router.get('/completed', ensureLoggedIn, fetchTodos, function(req, res, next) {
  res.locals.todos = res.locals.todos.filter(function(todo) { return todo.completed; });
  res.locals.filter = 'completed';
  res.render('index', { user: req.user, title: process.env.TITLE  });
});

router.post('/', ensureLoggedIn, function(req, res, next) {
  req.body.title = req.body.title.trim();
  next();
}, function(req, res, next) {
  if (req.body.title !== '') { return next(); }
  return res.redirect('/' + (req.body.filter || ''));
}, function(req, res, next) {
  db.run('INSERT INTO todos (owner_id, title, completed) VALUES (?, ?, ?)', [
    req.user.id,
    req.body.title,
    req.body.completed == true ? 1 : null
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/:id(\\d+)', ensureLoggedIn, function(req, res, next) {
  req.body.title = req.body.title.trim();
  next();
}, function(req, res, next) {
  if (req.body.title !== '') { return next(); }
  db.run('DELETE FROM todos WHERE id = ? AND owner_id = ?', [
    req.params.id,
    req.user.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
}, function(req, res, next) {
  db.run('UPDATE todos SET title = ?, completed = ? WHERE id = ? AND owner_id = ?', [
    req.body.title,
    req.body.completed !== undefined ? 1 : null,
    req.params.id,
    req.user.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/:id(\\d+)/delete', ensureLoggedIn, function(req, res, next) {
  db.run('DELETE FROM todos WHERE id = ? AND owner_id = ?', [
    req.params.id,
    req.user.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/toggle-all', ensureLoggedIn, function(req, res, next) {
  db.run('UPDATE todos SET completed = ? WHERE owner_id = ?', [
    req.body.completed !== undefined ? 1 : null,
    req.user.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/clear-completed', ensureLoggedIn, function(req, res, next) {
  db.run('DELETE FROM todos WHERE owner_id = ? AND completed = ?', [
    req.user.id,
    1
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});
*/

module.exports = router;
