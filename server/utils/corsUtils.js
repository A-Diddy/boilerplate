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

const userIdCookie = (req, res, next) => {
  // console.log("[corsUtils] userIdCookie()");
  // console.log("[corsUtils] userIdCookie(): req.cookies = ", req.cookies);
  console.log("[corsUtils] userIdCookie(): req.session = ", req.session);
  console.log("[corsUtils] userIdCookie(): req.session.username = ", req.session?.passport?.user?.username);
  res.cookie('X-USER-ID', req.session?.passport?.user?.id || "");
  res.cookie('X-USER-NAME', req.session?.passport?.user?.username || req.session?.passport?.user?.name || "");
  next();
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