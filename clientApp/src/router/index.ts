// @ts-ignore
import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EmailVerify from '../views/EmailVerifyView.vue'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import ProfileView from '../views/ProfileView.vue'
import UnauthorizedView from '@/views/UnauthorizedView.vue'

import {AuthAPI} from "@/services/auth";
// @ts-ignore
import {clearAuth, getConnectionSettings, getPermissions, hasPriv, isAuthenticated} from "@/utils/appUtils.js";

const authService = new AuthAPI(getConnectionSettings()).auth;

/***********************************************
 * Authentication check
 * @param to
 ***********************************************/
const auth = (to: any) => {
  if (!isAuthenticated() && to.name !== 'login') {
    return {name: 'login', query: {r: to.name}};    // Route to login and set redirect ('r') query param.
  } else {
    console.log("[router] auth(): Allowing access to: ", to.path);
  }
}

/***********************************************
 * Privileges check (authorization)
 *
 *  Based on the target path (view), checks that the
 *  associated privilege for that view is
 *  available for the current user. If not, redirects
 *  to the 'Unauthorized' page.
 *
 * @param to
 ***********************************************/
const priv = (to: any) => {
  switch (to.name) {
    case 'createGig':
      // TODO: Loop through clients the user has access to
      if (!hasPriv("createGig")) {
        console.log("[router] priv(): Unauthorized page access: ", to.name);
        return {name: 'unauthorized'}
      } else {
        console.log("[router] priv(): Allowing access to: ", to.path);
      }
      break;
  }
}

/***********************************************
 * Remove auth session
 * @param to
 ***********************************************/
const unauth = (to: any) => {
  console.log("[index] unauth(",to,")");
  if (!isAuthenticated() && to.name !== 'login') {
    // Already logged out
    // return {name: 'home'};
  } else {
    // Proceed to end session
    authService.logout();
    // Clear cookies
    clearAuth();
    console.log("[router] unauth(): Removed auth session: ");
  }
  return {name: 'login'};
}

/***********************************************
 * ROUTER
 ***********************************************/
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    // beforeEnter: [auth],
    meta: {navBar: true},
    component: HomeView
  }, {
    path: '/home',
    name: 'home2',
    beforeEnter: [auth],
    meta: {navBar: true},
    component: HomeView
  }, {
    path: '/login',
    name: 'login',
    component: LoginView
  }, {
    path: '/signup',
    name: 'signup',
    component: SignupView
  }, {
    path: '/forgot_password',
    name: 'forgotPassword',
    component: ForgotPasswordView
  }, {
    path: '/reset_password',
    name: 'reset_password',
    component: ResetPasswordView
  }
  // TODO: Change password... (when authenticated, enter the current password and the new password + confirm)
  // , {
  //   path: '/change_password',
  //   name: 'changePassword',
  //   component: () => import('../views/ForgotPasswordView.vue')
  // }
  , {
    path: '/verify_email',
    name: 'verify_email',
    component: EmailVerify,
  }, {
    path: '/logout',
    name: 'logout',
    beforeEnter: [unauth],      // TODO: Test that this calls logout
    // component: HomeView
    component: LoginView
  }, {
    path: '/profile',
    name: 'profile',
    meta: {navBar: true},
    beforeEnter: [auth],
    component: ProfileView
  }, {
    path: '/unauthorized',
    name: 'unauthorized',
    component: UnauthorizedView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/*************************************
 * beforeEach():
 *
 *   Called for each route and before
 *   individual 'beforeEnter' guards.
 *
 *************************************/
router.beforeEach(async (to, from, next) => {
  // Ensure permissions are loaded before routing.
  await getPermissions();  // This prevents the screens from flashing if the permissions are updated after being loaded.
  next();
})

export default router
