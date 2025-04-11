// @ts-ignore
import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EmailVerify from '../views/EmailVerifyView.vue'
import LoginView from '../views/LoginView.vue'
// @ts-ignore
import * as UserService from "@/services/user/UserService";
import {AuthAPI} from "@/services/auth";

// import * as AuthService from "@/services/auth/services/AuthService";
// @ts-ignore
import {getConnectionSettings, hasPriv} from "@/utils/appUtils.js";
import {IoAPI} from "@/services/io";

const authService = new AuthAPI(getConnectionSettings()).auth;

/***********************************************
 * Authentication check
 * @param to
 ***********************************************/
const auth = (to: any) => {
  if (!UserService.isAuthenticated() && to.name !== 'login') {
    return {name: 'login'};
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
  if (!UserService.isAuthenticated() && to.name !== 'login') {
    // Already logged out
    return {name: 'home'};
  } else {
    // Proceed to end session
    authService.logout();
    // Clear cookies
    UserService.clearAuth();
    console.log("[router] unauth(): Removed auth session: ");
    return {name: 'login'};
  }
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
    path: '/login',
    name: 'login',
    component: () => import(/* webpackChunkName: "auth" */ '../views/LoginView.vue')
  }, {
    path: '/signup',
    name: 'signup',
    component: () => import(/* webpackChunkName: "auth" */ '../views/SignupView.vue')
  }, {
    path: '/forgot_password',
    name: 'forgotPassword',
    component: () => import(/* webpackChunkName: "auth" */ '../views/ForgotPasswordView.vue')
  }, {
    path: '/reset_password',
    name: 'reset_password',
    component: () => import(/* webpackChunkName: "auth" */ '../views/ResetPasswordView.vue')
  }
  // TODO: Change password... (when authenticated, enter the current password and the new password + confirm)
  // , {
  //   path: '/change_password',
  //   name: 'changePassword',
  //   component: () => import(/* webpackChunkName: "auth" */ '../views/ForgotPasswordView.vue')
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
    component: () => import(/* webpackChunkName: "profile" */ '../views/ProfileView.vue')
  }, {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import(/* webpackChunkName: "onboarding" */ '../views/UnauthorizedView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
