const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oidc');
const FacebookStrategy = require('passport-facebook');
const TwitterStrategy = require('passport-twitter');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const AppleStrategy = require('@nicokaiser/passport-apple');
const querystring = require('querystring');
const crypto = require('crypto');
const db = require('../db');
const IoService = require("../server/services/io/ioService");
const knexInstance = require("../server/db/knexInstance");
const UUID = require('uuid');
const nodemailer = require('nodemailer');
const {userIdCookie} = require("../server/utils/corsUtils");
const logger = require("../server/utils/logger");
const ErrorResponse = require('./routerUtils').ErrorResponse;
const AuthService = require("../server/services/auth/authService");

const router = express.Router();

const AUTH_OPTIONS = {
  // successReturnToOrRedirect: '/',
  keepSessionInfo: true
  // ,  failureRedirect: '/auth/login'
  // ,  passReqToCallback: false
};

const USERS_TABLE = "users";
const FED_CRED_TABLE = "federated_credentials";
const TOKENS_TABLE = "tokens";
const PASSWORD_ENTITY = "password";
const GOOGLE_PROFILE_TYPE = "GOOGLE";
const APPLE_PROFILE_TYPE = "APPLE";
const TWITTER_PROFILE_TYPE = "TWITTER";
const LINKEDIN_PROFILE_TYPE = "https://linkedin.com";
const FB_PROFILE_TYPE = "CUCKBOOK";

/*****************************************************
 * Map federated profiles to local profile type.
 *
 * @param profile
 * @param type
 * @returns object: The local profile object
 *****************************************************/
const mapFedProfileToLocalProfile = (profile, type) => {
  console.log("mapFedProfileToLocalProfile(", {profile, type}, ")");
  switch (type) {
    case APPLE_PROFILE_TYPE:
      // TODO
      return {};
    case TWITTER_PROFILE_TYPE:
      // TODO
      return {};
    case FB_PROFILE_TYPE:
      // TODO
      return {};
    case LINKEDIN_PROFILE_TYPE:
      return {
        userId: profile.userId,
        contactInfo: {
          firstName: profile?.name?.givenName,
          // middleName: profile?.name?.middleName,
          lastName: profile?.name?.familyName,
          email: profile?.emails[0]?.value,
        }
      };
    default: // Includes GOOGLE_PROFILE_TYPE
      return {
        userId: profile.userId,
        contactInfo: {
          firstName: profile?.name?.givenName,
          middleName: profile?.name?.middleName,
          lastName: profile?.name?.familyName,
          email: profile?.emails[0]?.value,
          // tel: "",
        }
      }
  }
}

const getEmailFromProfile = (profile, type) => {

  // TODO: Support multiple emails from profile.
  // TODO: How to handle if multiple profile emails match multiple accounts???

  switch (type) {
    case APPLE_PROFILE_TYPE:
      // TODO
      return {};
    case TWITTER_PROFILE_TYPE:
      // TODO
      return {};
    case FB_PROFILE_TYPE:
      // TODO
      return {};
    case LINKEDIN_PROFILE_TYPE:
      return profile?.emails[0]?.value;
    default: // Includes GOOGLE_PROFILE_TYPE
      return profile?.emails[0]?.value
  }
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

/*****************************************************
 * Is the token valid?
 *
 *  Checks if the token is expired by adding 'expire_in' (ms) to the
 *  'updated_on' time.
 *
 *  true: If the token is not expired.
 *  false: If the token is expired.
 *
 *
 * @param {object} tokeRec: Token record from db
 * @param {number} addExpiryTime: Time (milliseconds) added to 'expire_in'
 * @return {boolean} TRUE: Token is valid | FALSE: Token is invalid
 *****************************************************/
const isTokenValid = (tokeRec, addExpiryTime = 0) => {
  if (tokeRec.expire_in > 0) {
    const lastUpdated = new Date(tokeRec.updated_at);
    const expireTime = lastUpdated.valueOf() + tokeRec.expire_in + addExpiryTime;
    const now = Date.now().valueOf();
    // console.log("Time (",now,") vs Expire time (",expireTime,")")
    return (now < expireTime);
  }
  return true;
}

/*****************************************************
 * Verifies a password.
 *
 *   Looks up user by 'userId' then salts, hashes and compares
 *   'password' to the persisted version.
 *
 * @param userId
 * @param password
 * @return {Promise<boolean>}
 *****************************************************/
const verifyPassword = (userId, password) => {
  // console.log("verifyPassword(",{userId, password},")");
  if (!userId || !password) {
    return Promise.resolve(false);
  }

  return knexInstance(USERS_TABLE)
    .where({id: userId})
    .select('*')
    .then(async (res) => {
      // console.log("User data = ", res);
      if (res.length <= 0) {
        return Promise.resolve(false);
      }

      const row = res[0];

      return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function (err, hashedPassword) {
          // console.log("hashedPassword = ", hashedPassword);
          if (err) {
            return resolve(false);
          }
          // console.log("timingSafeEqual = ", crypto.timingSafeEqual(row.hashed_password, hashedPassword));

          return resolve(crypto.timingSafeEqual(row.hashed_password, hashedPassword));
        });
      })
    })
    .catch((e) => {
      console.log(e);
      return false;
    });
}


/*********************************************************
 * Update user password.
 *
 *  Generates a salt string, hashes the input password
 *  then saves both to user record.
 *
 * @param userId
 * @param password
 * @return {Promise<>}: Promise to db update.
 *********************************************************/
const updateUserPassword = (userId, password) => {
  // TODO: Save new password... then go use this function where it can be

  // Salt, hash and save new password
  const salt = crypto.randomBytes(16);

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 310000, 32, 'sha256', async function (err, hashedPassword) {
      if (err) {
        return reject(err);
      }

      const columns = {
        hashed_password: hashedPassword,
        salt: salt
      }

      return await knexInstance(USERS_TABLE)
        .update(columns)
        .where({id: userId})
        .then((result) => {
          // console.log("Password update DB result = ", result);
          return resolve(result);
        })
        .catch((e) => {
          console.log(e);
          return reject(e);
        });
    });
  })
};

const isEmailNew = (email) => {
  return knexInstance(USERS_TABLE)
    .returning('id')
    .select({email: email})
    .then((results,) => {
      return results.length <= 0;
    });
}

const getUserIdByEmail = (email) => {
  return knexInstance(USERS_TABLE)
    .returning('id')
    .where({email: email})
    .then((results,) => {
      return results[0]?.id;
    });
}

/////////////////////////////////////////////////////////////////////////
// OAUTH
/////////////////////////////////////////////////////////////////////////

// Configure the Google/Facebook/LinkedIn/Twitter strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.

function jitProvision(provider, profile, cb) {

  console.log("jitProvision(", {provider, profile}, ")");

  knexInstance(FED_CRED_TABLE)
    .select('*')
    .where({"provider": provider, subject: profile.id})
    .then(async (res) => {
      if (res.length <= 0) {
        // These federated credentials are new... let's get as much data as we can from them.
        // TODO: Check to see if a user with the email address exists
        // if so... we don't need to create a new user nor profile, just a new fed_cred record

        // ... and then possibly add any missing profile data (i.e. name, etc)

        // const newUser = await isEmailNew(email);

        // Do we have the profile's email address associated with an existing user?

        const email = getEmailFromProfile(profile, provider);
        let userId = await getUserIdByEmail(email);

        console.log("Got existing user ID: ", userId);


        if (!userId) {
          console.log("NEW USER");

          userId = UUID.v4();

          // New user
          // const newId = UUID.v4();
          const json_data = {
            id: userId,
            name: profile.displayName
          }

          // Insert new user record
          const newUserInsertResults = await knexInstance(USERS_TABLE)
            .returning('id')
            .insert({id: userId, name: profile.displayName, json_data: json_data, email: email})
            .catch((e) => {
              console.log(e);
              return cb(e);
            });

          console.log("newUserInsertResults = ", newUserInsertResults);
        } else {
          console.log("ADDING FED ACCOUNT TO EXISTING USER");
        }

        // knexInstance(USERS_TABLE)
        //   .returning('id')
        //   .insert({id: userId, name: profile.displayName, json_data: json_data, email: getEmailFromProfile(profile)})
        //   .then((result,) => {

        // Create federated_credentials record
        knexInstance(FED_CRED_TABLE)
          .returning('id')
          .insert({user_id: userId, provider: provider, subject: profile.id, json_data: profile})
          .then(async (result,) => {
            // Create profile record with mapping from fed profile to local profile and save it.
            profile.userId = userId;   // Add the new userId to the profile to link them
            // TODO: Determine federated type for mapping using provider string.
            // createProfile(mapFedProfileToLocalProfile(profile, federated_type));
            const createProfileResult = await createProfile(mapFedProfileToLocalProfile(profile, provider));

            if (!createProfileResult) {
              console.log("WARNING: Profile not created... ", createProfileResult);
              // TODO: Handle this...
            }

            const user = {
              id: userId,
              name: profile.displayName
            };
            return cb(null, user);
          })
          .catch((e) => {
            console.log(e);
            return cb(e);
          });
        return userId;
        // })
        // .catch((e) => {
        //   console.log(e);
        //   return cb(e);
        // });
      } else {
        // Existing user
        const user = res[0];
        knexInstance(USERS_TABLE)
          .select('*')
          .where({id: user.user_id})
          .then((res) => {
            if (res <= 0) {
              return cb(null, false);
            }
            return cb(null, res[0]);
          })
          .catch((e) => {
            return cb(e);
          });
      }
    })
    .catch((e) => {
      return cb(e);
    });
}

if (process.env['GOOGLE_AUTH'] === "true") {
  passport.use(new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: '/oauth2/redirect/google',
    scope: ['profile', 'email']
  }, function verify(issuer, profile, cb) {
    return jitProvision(issuer, profile, function (err, user) {
      if (err) {
        return cb(err);
      }
      // Create profile record with mapping from Google profile to local profile and save it.
      // createProfile(mapFedProfileToLocalProfile(profile, GOOGLE_PROFILE_TYPE));
      const cred = {
        id: profile.id,
        provider: issuer
      };
      if (profile.emails && profile.emails[0]) {
        cred.id = profile.emails[0].value;
      }
      if (profile.displayName) {
        cred.name = profile.displayName;
      }
      return cb(null, user, {credential: cred});
    });
  }));
}

if (process.env['LINKEDIN_AUTH'] === "true") {
  passport.use(new LinkedInStrategy({
    clientID: process.env['LINKEDIN_API_KEY'],
    clientSecret: process.env['LINKEDIN_SECRET_KEY'],
    callbackURL: 'https://ExampleBoilerplate.com/oauth/callback/linkedin',
    scope: ['r_emailaddress', 'r_liteprofile'],
    state: true
  }, function verify(token, tokenSecret, profile, cb) {
    console.log("LINKEDIN verify()");
    return jitProvision('https://linkedin.com', profile, function (err, user) {
      console.log("LINKEDIN Auth token received. profile = ", profile);
      if (err) {
        return cb(err);
      }
      var cred = {
        id: profile.id,
        provider: 'https://linkedin.com'
      };
      if (profile.username) {
        cred.id = profile.username;
      }
      if (profile.emails && profile.emails[0]) {
        cred.id = profile.emails[0].value;
      }
      if (profile.displayName) {
        cred.name = profile.displayName;
      }
      return cb(null, user, {credential: cred});
    });
  }));
}

if (process.env['FACEBOOK_AUTH'] === "true") {
  passport.use(new FacebookStrategy({
    clientID: process.env['FACEBOOK_CLIENT_ID'],
    clientSecret: process.env['FACEBOOK_CLIENT_SECRET'],
    callbackURL: '/oauth2/redirect/facebook',
    scope: ['public_profile', 'email'],
    state: true
  }, function verify(accessToken, refreshToken, profile, cb) {
    return jitProvision('https://www.facebook.com', profile, function (err, user) {
      if (err) {
        return cb(err);
      }
      var cred = {
        id: profile.id,
        provider: 'https://www.facebook.com'
      };
      if (profile.emails && profile.emails[0]) {
        cred.id = profile.emails[0].value;
      }
      if (profile.displayName) {
        cred.name = profile.displayName;
      }
      return cb(null, user, {credential: cred});
    });
  }));
}

if (process.env['TWITTER_AUTH'] === "true") {
  passport.use(new TwitterStrategy({
    consumerKey: process.env['TWITTER_CONSUMER_KEY'],
    consumerSecret: process.env['TWITTER_CONSUMER_SECRET'],
    callbackURL: '/oauth/callback/twitter'
  }, function verify(token, tokenSecret, profile, cb) {
    return jitProvision('https://twitter.com', profile, function (err, user) {
      if (err) {
        return cb(err);
      }
      var cred = {
        id: profile.id,
        provider: 'https://twitter.com'
      };
      if (profile.username) {
        cred.id = profile.username;
      }
      if (profile.emails && profile.emails[0]) {
        cred.id = profile.emails[0].value;
      }
      if (profile.displayName) {
        cred.name = profile.displayName;
      }
      return cb(null, user, {credential: cred});
    });
  }));
}


/* Configure password authentication strategy.
 *
 * The `LocalStrategy` authenticates users by verifying a username and password.
 * The strategy parses the username and password from the request and calls the
 * `verify` function.
 *
 * The `verify` function queries the database for the user record and verifies
 * the password by hashing the password supplied by the user and comparing it to
 * the hashed password stored in the database.  If the comparison succeeds, the
 * user is authenticated; otherwise, not.
 */
passport.use(new LocalStrategy(async function verify(username, password, cb) {
  console.log("Retrieving user (", username, ") from db...");
  knexInstance(USERS_TABLE)
    .select('*')
    .where({"username": username})
    .then((res) => {
      if (res.length <= 0) {
        console.log('Incorrect username or password.');
        return cb(null, false, {message: 'Incorrect username or password.'});
      }

      const row = res[0];

      crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function (err, hashedPassword) {
        if (err) {
          return cb(err, false, {message: 'Unable to hash password.'});
        }
        if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
          console.log('Incorrect username or password. 2');
          return cb(null, false, {message: 'Incorrect username or password.'});
        }
        console.log('Success: ', row);
        return cb(null, row);
      });
    })
    .catch((e) => {
      console.log('Error: ', e);
      return cb(e);
    });


  // TODO: Replace the above with this...
  // const isPasswordValid = await verifyPassword(userId, password);


}));

/* Configure session management.
 *
 * When a login session is established, information about the user will be
 * stored in the session.  This information is supplied by the `serializeUser`
 * function, which is yielding the user ID and username.
 *
 * As the user interacts with the app, subsequent requests will be authenticated
 * by verifying the session.  The same user information that was serialized at
 * session establishment will be restored when the session is authenticated by
 * the `deserializeUser` function.
 *
 * Since every request to the app needs the user ID and username, in order to
 * fetch, that information is stored in the session.
 */
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, {id: user.id, username: user.username, name: user.name});
  });
});


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that we
// are not relying on a user's email or username, the complete Auth Provider
// profile is serialized and deserialized.
passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});


function setFederatedCredentialCookie(req, res, next) {
  const credential = req.authInfo.credential;
  if (!credential) {
    return next();
  }
  res.cookie('fc', querystring.stringify(credential));
  res.cookie('fc', querystring.stringify(credential));
  next();
}


/* GET /login
 *
 * This route prompts the user to log in.
 *
 * The 'login' view renders an HTML form, into which the user enters their
 * username and password.  When the user submits the form, a request will be
 * sent to the `POST /login/password` route.
 */
router.get('/login', function (req, res, next) {
  res.render('login', {title: process.env.TITLE});
});


/////////////////////////////////////////////////////////////////////////
// LOCAL AUTH
/////////////////////////////////////////////////////////////////////////

/* POST /login/password
 *
 * This route authenticates the user by verifying a username and password.
 *
 * A username and password are submitted to this route via an HTML form, which
 * was rendered by the `GET /login` route.  The username and password is
 * authenticated using the `local` strategy.  The strategy will parse the
 * username and password from the request and call the `verify` function.
 *
 * Upon successful authentication, a login session will be established.  As the
 * user interacts with the app, by clicking links and submitting forms, the
 * subsequent requests will be authenticated by verifying the session.
 *
 * When authentication fails, the user will be re-prompted to login and shown
 * a message informing them of what went wrong.
 */
// router.post('/login/password', (req, res, next) => {

router.use(express.json());


router.post('/login', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    console.log("[AuthRouter] POST/auth/login:  req.session = ", req.session);


    // Session is created in the next step.
    // Call this directly (instead of middleware, to pass in req, res and next objects.
    // Callback gets...
    // error: message (err) and code (i.e. 400)
    // success: null (err) and returned user object
    passport.authenticate('local', AUTH_OPTIONS, (err, user, errDetails) => {
      // Callback
      console.log("Local authentication results: error = ", err, " user = ", user, " errDetails = ", errDetails);

      // TODO: Get user object into cookie
      // res.cookie('X-USER', req.session.passport?.user?.id);

      if (err) {
        // Error while comparing/hashing password
        res.status(406);
        return res.end(JSON.stringify(new ErrorResponse("Server Error", "1", errDetails?.message, [])));
      } else if (!user) {
        // Incorrect username or password
        res.status(200);
        return res.end(JSON.stringify(new ErrorResponse("Error", "1", errDetails?.message, [])));
      }

      // return res.redirect( "/login" )

      console.log("[AuthRouter] Calling req.login()...");
      req.logIn(user, {}, (err) => {
        console.log("[AuthRouter] req.login() callback(", user, ",", err, ")...");
        if (err) {
          // Express login fail
          res.status(500);
          return res.end(JSON.stringify(new ErrorResponse("Server Error", "1", err, [])));
        } else {
          // Express login success
          console.log("[AuthRouter] req.session?.passport?.user = ", req.session?.passport?.user);
          userIdCookie(req, res); // Don't include a next() function to call since we're handling the send here.
          res.status(200);
          return res.end(JSON.stringify(user?.json_data));
        }
      })
    })(req, res, next);
  }
  /*,
  // The next step will only be called if the previous authentication step fails.
  (req, res, next) => {
    console.log("[Auth] req.user = ", req.user);
    console.log("req.sessions = ", req.session);

    // res.json({msg: "Error authenticating"});
    next();

    // if (process.env['SERVER_SIDE_AUTH']?.toLowerCase() === "true") {
    // return res.redirect(req?.session?.returnTo || '/');
    // } else {
    //   res.send();
    // }
  }*/
);

// app.get('/protected', function(req, res, next) {
//   passport.authenticate('local', function(err, user, profile) {
//     if (err) { return next(err) }
//     if (!user) { return res.redirect('/signin') }
//     res.redirect('/account');
//   })(req, res, next);
// });
/* GET /signup
 *
 * This route prompts the user to sign up.
 *
 * The 'signup' view renders an HTML form, into which the user enters their
 * desired username and password.  When the user submits the form, a request
 * will be sent to the `POST /signup` route.
 */

// 2025-02-04 [AS]: Commented this out to use client app signup page.
// router.get('/signup', function (req, res, next) {
//   res.render('signup', {title: process.env.TITLE});
// });

/* POST /signup
 *
 * This route creates a new user account.
 *
 * A desired username and password are submitted to this route via an HTML form,
 * which was rendered by the `GET /signup` route.  The password is hashed and
 * then a new user record is inserted into the database.  If the record is
 * successfully created, the user is logged in.
 */
router.post('/signup', AuthService.newUserValidation, async function (req, res, next) {
  // console.log("[AuthRouter] PASSED New User Validation. Error messages: ", res.locals.messages);

  if (res.locals.messages.length > 0) {
    res.status(406);
    return res.end(JSON.stringify(new ErrorResponse("Error", "1", "Username and/or email already exist.", res.locals.messages)));
  }

  // Create New User

  // AuthService.createNewUser(username, email, password).then(())

  const salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', async function (err, hashedPassword) {
    if (err) {
      return next(err);
    }

    // Generate UUID
    const newId = UUID.v4();
    const json_data = {id: newId, username: req.body.username};

    const columns = {
      id: newId,
      username: req.body.username,
      email: req.body.email,
      hashed_password: hashedPassword,
      salt: salt,
      json_data: json_data
    }

    await knexInstance(USERS_TABLE)
      .returning('id')
      .insert(columns)
      .then((result,) => {
        // console.log("[Auth] POST/signup: INSERT Result = ", result);

        createProfile({userId: newId, contactInfo: {email: req.body.email}}); // Insert local profile record

        const user = {
          id: newId,    // result.id
          username: req.body.username
        };
        req.login(user, function (err) {
          if (err) {
            // Express login fail
            logger.error(err);
            res.status(500);
            return res.end(JSON.stringify(new ErrorResponse("Server Error", "1", err, [])));
            // return next(err);
          }
          // Success
          userIdCookie(req, res);
          res.status(200);
          return res.end(JSON.stringify(user));
          // res.redirect('/');
        });
      })
      .catch((err) => {
        // Error writing to database
        console.log(err);
        logger.error(err);
        res.status(500);
        return res.end(JSON.stringify(new ErrorResponse("Server Error", "1", err, [])));
        // return next(e);
      });
  });
});

router.get('/forgot', function (req, res) {
  res.render('forgot', {user: req.user, title: process.env.TITLE});
});


router.post('/forgot', async function (req, res) {
  // console.log("[Auth] POST/forgot(): req.body = ", req.body);

  const username = req.body.username;
  const email = req.body.email;
  let msg = '';

  // Check for username (default)
  // Check for email address (fallback)

  if (!username && !email) {
    return res.send('Must provide a username or email address');
  }

  const user = await knexInstance(USERS_TABLE)
    .select('*')
    .where({"username": username})
    .orWhere({"email": email})
    .then((result) => {
      if (result.length <= 0) {
        console.log("User not found: ", result);
        // If not found, return message
        msg = "Unable to locate a user for the entered username or email";
        msg += ' Need to sign up?'
      } else {
        // console.log("User FOUND: ", result);
        return result[0];
      }
    });

  if (!user || !user.id) {
    console.log("User not found: ", user);

    // TODO: Add the message to the res.locals.messages array instead of updating the response body... we want to stay on the page.
    return res.send(msg);
  }

  // else Generate token
  const token = crypto.randomBytes(20).toString('hex');
  const lifetime = 3600000; // 1 hour
  //
  // user.resetPasswordToken = token;
  // user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

  const newPasswordResetTokenColumns = {
    entity: PASSWORD_ENTITY,
    user_id: user.id,
    token: token,
    expire_in: lifetime,
    json_data: {resetCount: 1}
  }

  // Save reset token
  await knexInstance(TOKENS_TABLE)
    .select()
    .where({user_id: user.id})
    .andWhere({entity: PASSWORD_ENTITY})
    .then(async (result) => {
      if (result.length <= 0) {
        await knexInstance(TOKENS_TABLE)
          .insert(newPasswordResetTokenColumns)
          .where({user_id: user.id})
          .andWhere({entity: PASSWORD_ENTITY})
      } else {
        newPasswordResetTokenColumns.json_data.resetCount = 1 + result[0].json_data.resetCount;
        await knexInstance(TOKENS_TABLE)
          .update(newPasswordResetTokenColumns)
          .where({user_id: user.id})
          .andWhere({entity: PASSWORD_ENTITY})
      }
    })
    .catch((e) => {
      console.log(e);
      // TODO: Send an error response and end process chain
    });

  // Send reset page link with embedded token via email
  const mailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to: user.email,
    subject: 'Password Reset for Example Boilerplate',
    text: 'A request has been made to reset your Example Boilerplate account password.\n\n' +
      'Please click on the following link or paste it into your browser to complete the process:\n' +
      process.env.HOST + '/reset/' + token + '\n\n' +
      // 'http://' + req.headers.host + '/reset/' + token + '\n\n' +
      'If you did not request to reset the password, please ignore this email and your password will remain unchanged.\n'
  };

  // TODO: Mondularize mailer...
  try {
    const transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        msg = 'There was an error sending an email to ' + user.email + '. Might want to try again.';
      } else {
        console.log('Email sent: ' + info.response);
        msg = `An email has been sent ${email === user.email ? "to '" + email + "' " : ""}with further instructions.`;
      }
      res.send(msg);


      // res.redirect('/forgot');
    });
  } catch (e) {
    console.log(e);
    msg = "There appears to be an error sending an email...";
    res.send(msg);
  }


});


/**********************************************************
 * If the /reset page is accessed without a token,
 * redirect to the /forgot page to create a new one.
 **********************************************************/
router.get('/reset', function (req, res) {
  res.render('forgot', {user: req.user, title: process.env.TITLE});
});

router.get('/reset/:token', async function (req, res) {
  const token = req.params.token;
  let msg = '';
  // console.log("[Auth] POST/reset: token = ", token);

  if (!token) {
    res.send("Invalid request... missing token.");
  }

  // TODO: Check if token exists, is valid and is not expired

  const user = await knexInstance(TOKENS_TABLE)
    .select('*')
    .where({token: token, entity: PASSWORD_ENTITY})
    .then(async (results) => {
      if (results.length > 0) {
        const tokeRec = results[0];

        if (!isTokenValid(tokeRec)) {
          // Token is invalid/expired
          msg = "Password reset request expired. Please resend a new request.";
          return;
        }

        // Got valid token
        // TODO: Get user record...
        const userId = tokeRec.user_id;

        return await knexInstance(USERS_TABLE)
          .select('*')
          .where({id: userId})
          .then((results) => {
            if (results.length > 0) {
              return results[0];
            } else {
              // This should technically never happen
              msg = "ERROR: No user found with the provided token.";
            }
          })
      }
    })
    .catch((e) => {
      console.log(e);
      return next(e);
    });

  if (!user || !user.id) {
    console.log("Unable to find user for provided token: ", user);
    return res.send(msg);
  }

  // console.log("Found user from token: ", user);

  res.render('reset', {userId: user.id, token: token, title: process.env.TITLE});
});


router.post('/reset', async function (req, res) {
  // console.log("[Auth] POST/reset(): req.body = ", req.body);
  const happyTime = 1000 * 60 * 2;  // 2 minutes in milliseconds
  const userId = req.body.userId;
  const token = req.body.token;
  const password = req.body.password;
  const confirmPassword = req.body.confirm_password
  let msg = '';

  // console.log({userId, token});

  if (!userId || !token) {
    return res.send('Invalid request... missing user and/or token parameters');
  }

  // Check that password and confirm_password match
  if (password !== confirmPassword) {
    return res.send('New password confirmation does not match');
  }

  // Check if token is still valid for userId
  const user = await knexInstance(TOKENS_TABLE)
    .select('*')
    .where({token: token, entity: PASSWORD_ENTITY, user_id: userId})
    .then(async (results) => {
      if (results.length > 0) {
        const tokeRec = results[0];
        if (!isTokenValid(tokeRec, happyTime)) {
          // Token is invalid/expired
          msg = "Reset request has expired. Please create a new request.";
          return;
        }
        // Got valid token
        const userId = tokeRec.user_id;

        // Get user record to confirm it exists.
        return await knexInstance(USERS_TABLE)
          .select('*')
          .where({id: userId})
          .then((results) => {
            if (results.length > 0) {
              return results[0];
            } else {
              // This should technically never happen
              msg = "ERROR: No user found with the provided token.";
            }
          })
          .catch((e) => {
            console.log(e);
            return next(e);
          });
      }
    })

  if (!user || !user.id) {
    console.log("Unable to find user for provided token: ", user);
    return res.send(msg);
  }

  // Salt, hash and save new password
  const salt = crypto.randomBytes(16);
  crypto.pbkdf2(password, salt, 310000, 32, 'sha256', async function (err, hashedPassword) {
    if (err) {
      return next(err);
    }

    const columns = {
      hashed_password: hashedPassword,
      salt: salt
    }

    await knexInstance(USERS_TABLE)
      .update(columns)
      .where({id: userId})
      .returning(["id", "name"])
      .then((result,) => {
        // console.log("[Auth] POST/reset: UPDATE Result = ", result);

        const user = {
          id: result.id,
          username: result.name
        };

        req.login(user, function (err) {
          if (err) {
            return next(err);
          }
          res.redirect('/');
        });
      })
      .catch((e) => {
        console.log(e);
        return next(e);
      });
  });

  // TODO: Invalidate token??
});

/*******************************************************
 * Change password.
 *
 *   Requires that the user is authenticated.
 *******************************************************/
router.get('/changePassword', function (req, res) {
  // console.log("[Auth] GET/changePassword: user = ", req.user);
  const userId = req.user?.id;
  let msg = '';

  if (!userId) {
    // msg = 'Please login first to change the password.';
    return res.redirect('/login')
  }

  res.render('changePassword', {user: req.user, title: process.env.TITLE, messages: [msg]});
});

router.post('/changePassword', async function (req, res) {
  let msg = '';
  const userId = req.user?.id;
  const existingPassword = req.body.existing_password;
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirm_password;

  // console.log("[Auth] POST/changePassword: ", {userId, existingPassword, newPassword, confirmPassword});

  if (!userId) {
    // msg = 'Please login first to change the password.';
    return res.redirect('/login')
  }

  // TODO: Check if password meets criteria

  // Check that password and confirm_password match
  if (newPassword !== confirmPassword) {
    return res.send('New password confirmation does not match');
  }

  // Check if existing_password matches
  const isPasswordValid = await verifyPassword(userId, existingPassword)
    .then((result) => {
      // console.log("isPasswordValid() result = ", result);
      return result;
    });
  // console.log("isPasswordValid = ", isPasswordValid);
  if (!isPasswordValid) {
    return res.send('Existing password is incorrect');
  }

  // req.login(user, function (err) {
  //   if (err) {
  //     return res.send(err);
  //   }
  // });

  // Save new password
  const updateResponse = await updateUserPassword(userId, newPassword);

  // console.log("updateResponse = ", updateResponse);
  msg = 'Password updated.';

  // Send message that password was changed successfully

  return res.send(msg);
})


// TODO: Roles and Permissions

/*******************************************************
 * User roles and permissions.
 *
 *   Requires that the user is authenticated.
 *******************************************************/
router.get('/userPermissions',
  AuthService.hasPriv(),
  function (req, res) {
  console.log("[Auth] GET/userPermissions: user = ", req.user);
  const userId = req.user?.id;

  AuthService.getUserPermissions(userId).then((result) => {
    res.status(200);
    return res.end(result);
  }).catch((msg) => {
    logger.info(msg);
    res.status(406);
    return res.end(JSON.stringify(new ErrorResponse("Invalid Request", "1", msg, [])));
  })
});





/* GET /login/federated/accounts.google.com
 *
 * This route redirects the user to Google, where they will authenticate.
 *
 * Signing in with Google is implemented using OAuth 2.0.  This route initiates
 * an OAuth 2.0 flow by redirecting the user to Google's identity server at
 * 'https://accounts.google.com'.  Once there, Google will authenticate the user
 * and obtain their consent to release identity information to this app.
 *
 * Once Google has completed their interaction with the user, the user will be
 * redirected back to the app at `GET /oauth2/redirect/accounts.google.com`.
 */
router.get('/login/federated/google', passport.authenticate('google'));

/*
    This route completes the authentication sequence when Google redirects the
    user back to the application.  When a new user signs in, a user account is
    automatically created and their Google account is linked.  When an existing
    user returns, they are signed in to their linked account.
*/
router.get('/oauth2/redirect/google',
  passport.authenticate('google', AUTH_OPTIONS),
  setFederatedCredentialCookie,
  // userIdCookie,
  function (req, res, next) {
    // This will only be called if passport.authenticate() doesn't redirect
    console.log("GET/oauth2/redirect/google: req.session = ", req.session);

    res.redirect('/');
  }
);

// -------------------
router.get('/login/federated/linkedin', passport.authenticate('linkedin'
//   , {
//   state: 'xyz'
// }
));

// Redirect from LinkedIn
router.get('/oauth/callback/linkedin',
  passport.authenticate('linkedin', AUTH_OPTIONS),
  setFederatedCredentialCookie,
  // function (req, res, next) {
  //   console.log("LINKEDIN Auth Success!!!!");
  //   res.redirect('/');
  // }
);

/*
// -------------------
router.get('/login/federated/facebook', passport.authenticate('facebook'));

router.get('/oauth2/redirect/facebook',
  passport.authenticate('facebook', AUTH_OPTIONS),
  setFederatedCredentialCookie,
  function(req, res, next) {
    res.redirect('/');
  }
);
// -------------------
router.get('/login/federated/twitter', passport.authenticate('twitter'));


router.get('/oauth/callback/twitter',
  passport.authenticate('twitter', AUTH_OPTIONS),
  setFederatedCredentialCookie, function(req, res, next) {
    res.redirect('/');
  }
);
*/


/////////////////////////////////////////////////////////////////////////
// APPLE ID AUTH
/////////////////////////////////////////////////////////////////////////

/*

passport.use(new AppleStrategy({
  clientID: process.env['APPLE_CLIENT_ID'],
  teamID: process.env['APPLE_TEAM_ID'],
  keyID: process.env['APPLE_KEY_ID'],
  callbackURL: 'https://ExampleBoilerplate.com/oauth2/redirect/apple',
  key: process.env['APPLE_KEY'],
  scope: ['name', 'email'],
  state: true
}, function verify(accessToken, refreshToken, profile, cb) {
  console.log('VERIFY APPLE!');
  console.log(accessToken);
  console.log(refreshToken);
  console.log(profile);

  db.get('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [
    'https://appleid.apple.com',
    profile.id
  ], function(err, row) {
    if (err) { return cb(err); }
    if (!row) {
      db.run('INSERT INTO users (name, username) VALUES (?, ?)', [
        profile.name,
        profile.name              // Need to ensure uniqueness
      ], function(err) {
        if (err) { return cb(err); }
        var id = this.lastID;
        db.run('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [
          id,
          'https://appleid.apple.com',
          profile.id
        ], function(err) {
          if (err) { return cb(err); }
          var user = {
            id: id,
            name: profile.name
          };
          return cb(null, user);
        });
      });
    } else {
      db.get('SELECT * FROM users WHERE id = ?', [ row.user_id ], function(err, row) {
        if (err) { return cb(err); }
        if (!row) { return cb(null, false); }
        return cb(null, row);
      });
    }
  });
}));


router.get('/login/federated/apple', passport.authenticate('apple'));

router.get('/oauth2/redirect/apple', passport.authenticate('apple', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/login'
}));

router.post('/oauth2/redirect/apple', passport.authenticate('apple', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/login'
}));

*/


/* POST /logout
 *
 * This route logs the user out.
 */
router.post('/logout', function (req, res, next) {
  // console.log("[AuthRouter] POST/logout(): req = ", req);
  req.logout(function (err) {
    console.log("[AuthRouter] /logout: req.logout() result = ", err);
    if (err) {
      // Express logout fail
      res.status(500);
      return res.end(JSON.stringify(new ErrorResponse("Server Error", "1", err, [])));
      // return next(err);
    }
    // if (process.env['SERVER_SIDE_AUTH']?.toLowerCase() === "true") {
    //   res.redirect('/auth/login');
    // } else {
    //   next();
    // }


    res.status(200);
    return res.end();

  });
});


/* GET /logout
 *
 * This route logs the user out.
 */
router.get('/logout', function (req, res, next) {
  console.log("[AuthRouter] GET/logout(): req = ", req);
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    if (process.env['SERVER_SIDE_AUTH']?.toLowerCase() === "true") {
      res.redirect('/auth/login');
    } else {
      next();
    }
  });
});

module.exports = router;
