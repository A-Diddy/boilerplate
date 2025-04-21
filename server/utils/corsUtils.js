const logger = require("./logger");

/**********************************************
 * Enables cookie support for csrf tokens.
 *
 *    Puts csrf cookie into request header so
 *    Passport can find it there.
 *
 * @param req
 * @param res
 * @param next
 **********************************************/
const csrfCookie = (req, res, next) => {
  // console.log("[corsUtils] csrfCookie()");
  console.log("[corsUtils] csrfCookie(): req.session = ", req.session);
  req.headers['x-csrf-token'] = req.cookies['_csrf'] || "";
  next();
}

/*************************************************
 * Deletes our user ID cookies.
 *
 *    Used to quickly remove the user cookies from the
 *    session.
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 *************************************************/
// It appears the cookies are still sent to the client...
const deleteUserIdCookies = (req, res, next) => {
  const cookiesToDelete = ['X-USER-ID', 'X-USER-NAME'];

  cookiesToDelete.forEach((cookieName) => {
    res.cookie(cookieName, '', { expires: new Date(0) });
  });

  if (next) {
    return next();
  }
}


/**************************************************
 * Adds our user ID cookies to the response.
 *
 *    Can be called as middleware or as an independent function.
 *    If not called as middleware, do not include a 'next' param.
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 **************************************************/
const userIdCookie = (req, res, next) => {
  console.log("[corsUtils] userIdCookie()");
  // console.log("[corsUtils] userIdCookie(): req.cookies = ", req.cookies);
  console.log("[corsUtils] userIdCookie(): req.session = ", req.session);
  console.log("[corsUtils] userIdCookie(): req.session.username = ", req.session?.passport?.user?.username);

  // TODO: This will append cookies instead of replacing existing ones. Maybe we should clear them first.

  // deleteUserIdCookies(req, res);
  res.cookie('X-USER-ID', req.session?.passport?.user?.id || "", { path: '/'});
  res.cookie('X-USER-NAME', req.session?.passport?.user?.username || req.session?.passport?.user?.name || "");
  res.cookie('expires', req.session?.passport?.user?.id && req.session.cookie?.expires ? req.session.cookie.expires?.toISOString() : 0);

/*  // Add the CSRF token to locals so it can be used in the SSR templates.
  res.locals.csrfToken = req.csrfToken();
  // Add the CSRF token to a cookie so the app can be served separately (dev server)
  res.cookie('XSRF-TOKEN', res.locals.csrfToken);*/

  if (next) {
    return next();
  }
}

const cors = (req, res, next) => {
  res.append('Access-Control-Allow-Origin', req.get('origin'));
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'X-Requested-With,x-csrf-token,authorization,content-type');

  if (req.method === "OPTIONS") {
    logger.info("[corsUtils] cors(): req.origin = ", req.get('origin'));
    return res.send();
  }

  next();
}

module.exports = {cors, csrfCookie, userIdCookie};