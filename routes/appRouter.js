require('dotenv').config();
const express = require('express');
const logger = require("../server/utils/logger");
const router = express.Router();

/*********************************************************
 * Handle app routing.
 *
 *  Any routes undefined on the server, that meet the below criteria,
 *  will be re-routed (handled) to the main app ('/').
 *  The requested URL will not be changed on the client... they
 *  will not know this handling has occurred.
 *
 *   Criteria to determine if this is an app route...
 *    - GET method
 *    - No periods/dots ('.') in the path (those are assumed to be reqs for static files)
 *
 *********************************************************/
router.get( /([/-]\w*)+/, (req, res, next) => {

  if (req.path.includes(".") || req.path.includes('favicon')) {
    return next();
  }

  // TODO: Handle server and app undefined routes and return a 404 status
  const whiteListedAppUrls = ["/o/*", "/gig/*", "/gigs"];
  // if (req.path not in whitelisted app urls) {
  //   next();  // This will cause the request to fall through to the catch-all 404 response (see app.js)
  // }

  logger.info(`[AppRouter] Redirecting to main app from '${req.originalUrl}'`);

  req.url = "/";                          // Set the route to process this request with
  req.session.returnTo = req.originalUrl; // This will take us back to the og app route after authentication, if needed.
  req.app._router.handle(req,res,next);   // Finally, process this request by the GET '/' route.
});

module.exports = router;
