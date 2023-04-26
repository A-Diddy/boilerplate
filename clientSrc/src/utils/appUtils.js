import jwt_decode from "jwt-decode";
import jwt_encode from "jwt-encode";
import {AuthAPI} from "@/services/auth";
import * as UUID from "uuid";
import {MediaAPI} from "../services/media/index";

export const getPermissions = async () => {
  const authService = new AuthAPI(getConnectionSettings()).auth;
  const perm = await authService.getPermissions()
    .catch((e) => {
      console.log(e);
      return {};
    });
  console.log("Got permissions: ", perm);
  window.GLOBAL_CONFIG.config.authorization = perm;
  return perm;
}

export const getConnectionSettings = (force = false) => {
  window.GLOBAL_CONFIG = window.GLOBAL_CONFIG || {};
  window.GLOBAL_CONFIG.config = window.GLOBAL_CONFIG.config || {};
  window.GLOBAL_CONFIG.config.user = window.GLOBAL_CONFIG.config.user || {};

  if (window.GLOBAL_CONFIG.config.connectionSettings && !force) {
    return window.GLOBAL_CONFIG.config.connectionSettings;
  }

  // If connectionSettings has not been defined, define it
  const cookies = document.cookie.split('; ');
  cookies.forEach((cookie) => {
    const splitCookie = cookie.split('=');
    const cookieName = splitCookie[0];
    const cookieValue = splitCookie[1];

    // 1. Get token
    if (cookieName.toLowerCase().includes('token')) {
      console.log("[App] Using token from cookie (",cookieName,"): ", cookieValue);
      window.GLOBAL_CONFIG.token = cookieValue;
    }

    // 2. Get User ID
    if (cookieName.toLowerCase().includes('user-id')) {
      console.log("[App] Using user ID from cookie (",cookieName,"): ", cookieValue);
      window.GLOBAL_CONFIG.config.user.id = cookieValue;
    }

    // Get User name (for display use only)
    if (cookieName.toLowerCase().includes('user-name')) {
      console.log("[App] Using username from cookie (",cookieName,"): ", cookieValue);
      window.GLOBAL_CONFIG.config.user.name = decodeURI(cookieValue);
    }
  })

  console.log('window.GLOBAL_CONFIG (after cookies): ', window.GLOBAL_CONFIG);

// Token needs to be retrieved at runtime and then used to instantiate each service
  window.GLOBAL_CONFIG.config.connectionSettings = {
    BASE: process.env.VUE_APP_HOST,
    HEADERS: {'x-csrf-token': window.GLOBAL_CONFIG.token}
  };

  return window.GLOBAL_CONFIG.config.connectionSettings;
}

export const expireSession = () => {
  window.GLOBAL_CONFIG.config.auth.exp = new Date() / 1000;
  clearSessionCookies();
}

export const clearSessionCookies = () => {
  const cookies = document.cookie.split('; ');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const splitCookie = cookie.split('=');
    const cookieName = splitCookie[0];
    const cookieValue = splitCookie[1];

    // 1. Get jwt
    if (cookieName.toLowerCase().includes('auth')) {
      try {
        // Remove cookie
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        console.log("Removing cookie: name = ", name);
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } catch (e) {
        console.log(e);
      }
    }
  }
}
export const setExp = () => {
  if (window.GLOBAL_CONFIG?.config?.auth?.exp && process.env.VUE_APP_LIVEON) {
    window.GLOBAL_CONFIG.config.auth.exp = window.GLOBAL_CONFIG.config.auth.exp + (60 * 24 * 365 * 1000);
    document.setCookie = "AuthToken=" + jwt_encode(window.GLOBAL_CONFIG.config.auth, process.env.VUE_APP_JWT_SECRET);
  }
}

export const hasPriv = (priv) => {
  console.log("[secUtils] hasPriv(", priv, "): ", window.GLOBAL_CONFIG.config.authorization?.permissions);
  const perms = window.GLOBAL_CONFIG.config.authorization?.permissions;

  if (!priv || !perms?.length) {
    return false;
  }

  for (let i = 0; i < perms.length; i++) {
    if (perms[i] === priv) {
      return true;
    }
  }
  return false;
}

/***********************************************
 * Submits a file.
 *
 *  Given a file field value, submits the file and
 *  returns the saved File ID.
 *
 * @param data
 * @returns {Promise<string>}: UUID used.
 ***********************************************/
const submitFile = async (data) => {
  if (!data) {
    return Promise.resolve("");
  }
  const mediaId = UUID.validate(data.id) ? data.id : UUID.v4();
  const file = data.file[0].file;
  // console.log("file name = ", file.name);

  const fileData = {
    id: mediaId,
    generatehash: true,
    source: file,
    mediatype: file.type,
    jsonData: {
      id: mediaId,
      name: file.name,
      mediaType: file.type,
      lastModified: file.lastModified,
      size: file.size
    }
  }
  // console.log("formData = ", formData.values());
  // console.log("fileData = ", fileData);
  const MediaService = new MediaAPI(getConnectionSettings()).media;
  return await MediaService.postMedia(fileData, window.GLOBAL_CONFIG?.token)
    .then((result) => {
      return result;
    })
    .catch(e => {
      console.log(e);
      return e;
    });
}
