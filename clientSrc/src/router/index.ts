// @ts-ignore
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
// @ts-ignore
import * as UserService from "@/services/user/UserService";
// @ts-ignore
import {hasPriv} from "@/utils/appUtils.js";

/***********************************************
 * Authentication check
 * @param to
 ***********************************************/
const auth = (to:any) => {
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
const priv = (to:any) => {
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
const unauth = (to:any) => {
  if (!UserService.isAuthenticated() && to.name !== 'login') {
    return { name: 'home' };
  } else {
    // Clear cookies
    UserService.clearAuth();
    console.log("[router] unauth(): Removed auth session: ");
    return { name: 'login' };
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
