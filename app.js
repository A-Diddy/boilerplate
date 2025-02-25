require('dotenv').config({ path:  `.env.${process.env.NODE_ENV}` });
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pg = require('pg');
const pgSessionStore = require('connect-pg-simple')(session);
const csrf = require('csurf');
const passport = require('passport');
const logger = require('morgan');
const fileLogger = require("./server/utils/logger");
const {cors, csrfCookie, userIdCookie} = require('./server/utils/corsUtils');
const indexRouter = require('./routes/index');
const authRouter_Local = require('./routes/auth');
const authRouter = require('./routes/authRouter');
const ioRouter = require('./routes/ioRouter');
const queryRouter = require('./routes/queryRouter');
const mediaRouter = require('./routes/mediaRouter');
const appRouter = require('./routes/appRouter');

// Database connection just for session storage... see /server/db/dbConfig.js for knex DB config.
// TODO: Possibly use knex for session storage also
const pgPool = new pg.Pool({
  host: process.env.DB_CONNECTION_URL,
  user: process.env.DB_CONNECTION_USER,
  password: process.env.DB_CONNECTION_PASSWORD,
  database: process.env.DB_CONNECTION_DATABASE,
  port: process.env.DB_CONNECTION_PORT,
  max: process.env.DB_CONNECTION_MAX,
  idleTimeoutMillis: process.env.DB_CONNECTION_IDLE_TIMEOUT_MS30000,
  connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT_MS
});

// Let's go...
const app = express();

// EJS view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.locals.pluralize = require('pluralize');

// Request processing logic start
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));  // Static assets from server

// app.use(csrfCookie);   // Adds csrf token to header

// Create auth 'sessions' database connection
// See https://expressjs.com/en/resources/middleware/session.html
app.use(session({
  secret: process.env["SESSION_SECRET"],
  resave: false,            // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored.
  store: new pgSessionStore({pool : pgPool, tableName : 'sessions'})
}));

/*console.log("Creating session with config: ", process.env.SESSION_SECRET, process.env['SESSION_ROLLING'], process.env['SESSION_MAXAGE_TIMEOUT'], parseInt( process.env['SESSION_MAXAGE_TIMEOUT'], 10), process.env['SESSION_SAMESITE']);
// console.log("JSON.parse(process.env['SESSION_ROLLING']): ", JSON.parse(process.env['SESSION_ROLLING']));
app.use(session({
  secret: process.env.SESSION_SECRET,   // [Required] Key used to sign session ID cookie
  resave: false,            // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored.
  store: new pgSessionStore({pool : pgPool, tableName : 'sessions'}),
  rolling: JSON.parse(process.env['SESSION_ROLLING']) ?? true,
  cookie: {
    maxAge: parseInt(process.env['SESSION_MAXAGE_TIMEOUT'], 10) || null,
    sameSite: JSON.parse(process.env['SESSION_SAMESITE']) ?? true,
  }
}));*/

// app.use(userIdCookie);    // Puts user details (id) into a cookie

// const csrfProtect = csrf({cookie: true})

// Enforce CSRF tokens with each POST request
if (process.env.BYPASS_CSRF_TOKEN !== "true") {
  app.use(
    // (req, res, next) => {
    //   console.log("CSRF Token validation... cookies = ", req.cookies);
    //   next();
    // },
    csrf()
//   ,
//   (req, res, next) => {
//   console.log("csrf result errors? = ", res.error);
//   console.log("csrf result: cookies = ", req.cookies);
//   next();
// }
  );
}

app.use(userIdCookie);    // Puts user details (id) into a cookie


// CORS and pre-flight handling
// if (process.env.TESTMODE === "true") {
  app.use(cors);
// }

// Authenticate session with each reqeust
app.use(passport.authenticate('session'));

app.use(function(req, res, next) {
  const msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  req.session.messages = [];
  next();
});

/****************************************************
 * Create a CSRF token and add it to the response.
 *
 *   res.locals: This makes the token available to the
 *               SSR EJS templates (i.e. login.ejs, etc.).
 *
 *   res.cookie: This makes the token available to pages
 *               rendered outside the server (i.e. SPAs
 *               served separately).
 ****************************************************/
// TODO: Move this to a utils (corsUtils or a new sessionUtils?)
app.use(function(req, res, next) {
  // Add the CSRF token to locals so it can be used in the SSR templates.
  if (process.env.BYPASS_CSRF_TOKEN !== "true") {
    res.locals.csrfToken = req.csrfToken() ?? "TEST MODE";
  }

  console.log("[App] Adding session details to cookie: ", req.session);
  // Add the CSRF token to a cookie so the app can be served separately (dev server)
  res.cookie('XSRF-TOKEN', res.locals.csrfToken);

  next();
});

// Log request and response details...
app.use((req, res, next) => {
  res.on('finish', () => {
    fileLogger.info(`${req.ip} -> ${req.method} ${req.originalUrl}... ${res.statusCode}`);
  });
  next();
});

/*******************************************************
 * Service routes
 *******************************************************/
app.use('/', indexRouter);    // Client app
app.use('/', authRouter_Local);     // Sign up, sign in, sign out, OAuth
app.use('/auth', authRouter); // Sign up, sign in, sign out, OAuth
app.use('/io', ioRouter);     // Data Retrieval and Updates (by index and uuid)
app.use('/q', queryRouter);   // Data Queries
app.use('/m', mediaRouter);   // Media Retrieval and Updates

/********************************************************
 * Client-side, single page app routes
 *
 *  [IMPORTANT] This is a catch-all and needs to be after the server defined routes, but before
 *  the static asset routes. Any GET request without a dot ('.') in the path that
 *  gets here will be sent back to the main app route ('/') for processing.
 ********************************************************/
app.use('/', appRouter);      // App routes (for views in client, not server assets)

/********************************************************
 * Static asset routes for client app
 *
 * [IMPORTANT] This needs to be after the server defined routes to ensure the app is
 * only accessible after authentication. Once authenticated, the app resources
 * must be served as static assets from the web root path for the distribution
 * bundle to work.
 ********************************************************/
app.use(express.static(path.join(__dirname, 'clientApp/dist')));

// Catch-all... anything else gets a 404 and error handled
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {title: process.env.TITLE });
});

module.exports = app;
