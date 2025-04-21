<template>
  <!--  Expiration Dialog -->
  <v-dialog style="max-width:500px;" v-model="dialog" persistent>
    <div id="container_confirmDialog" class="confirmDialog">
      <v-card title="Are you still there?">
        <div style="margin:10px; padding:10px;">
          Session will expire in: {{ timeToExpire }} seconds
        </div>
        <v-card-actions>
          <v-progress-linear
            v-if="state.loading"
            color="deep-purple-accent-4"
            indeterminate
            rounded
            height="6"
          ></v-progress-linear>
          <v-spacer></v-spacer>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="endSessionClicked()"
          >
            Sign out
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="saveClicked()"
          >
            <v-icon v-if="!state.loading">mdi-cube-send</v-icon>
            <v-progress-circular
              v-if="state.loading"
              indeterminate
              color="deep-orange-lighten-2"
            ></v-progress-circular>
            <span>
            Stay Signed In
          </span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </v-dialog>

  <!-- Result Snackbar -->
  <v-snackbar v-model="saveSnackbar" :timeout="snackbarTimeout">
    <span>{{ snackbarText }}</span>
  </v-snackbar>
</template>

<script setup>
import {onDeactivated, onMounted, reactive, ref} from 'vue';
import router from "@/router";
import {AuthAPI} from "@/services/auth";
import {
  Countdown,
  expireSession,
  getConnectionSettings,
  getNowSec,
  getNowMillisec,
  getSessionExp,
  getSessionInit, isAuthenticated, isSessionActive, getSessionExpSeconds, usingSessionExp
} from "../utils/appUtils.js";

const authService = new AuthAPI(getConnectionSettings()).auth;

// Input ------------------
const props = defineProps({
  // assignments: {}
})
// -------------------------
// Output -----------------
const emit = defineEmits(['refreshed', 'cancelled'])
const emitRefreshed = () => {
  emit('refreshed');
}
const emitCancel = () => {
  emit('cancelled');
}
// -------------------------

let timeToExpire = ref(0);
let dialog = ref(false);
let saveSnackbar = ref(false);
let state = ref({loading: false});
let snackbarText = "";
let lastActivity = getSessionInit() - 1000;
// let lastActivity = getNowMillisec();
let countdownInterval;
let sessionTimeout;
const snackbarTimeout = 3000;     // How long to display the snackbar (ms)
const sessionExpBuffer = 30;      // Time before expiration ends (to prompt user) (seconds)
const defaultHandlers = ['keydown', 'click'];
const handlers = new AbortController(); // Collect references to event handlers (for removing them on dismount)

const setSessionExpCheck = () => {
  if (!isSessionActive()) {
    // console.log("[SessionMgr] setSessionExpCheck(): Session not active... doing nothing.");
    return;   // If session is inactive, do nothing (needed to prevent session mgr on non-authenticated pages).
  }
  const secondsToExpire = getSessionExpSeconds() - getNowSec();
  // console.log("[SessionMgr] setSessionExpCheck(): Session active... setting timeout check for ", secondsToExpire);
  if (secondsToExpire <= 0) {
    endSession();
  }
  clearTimeout(sessionTimeout);
  sessionTimeout = setTimeout(sessionExpCheck, (secondsToExpire - sessionExpBuffer) * 1000);
}

/*************************************
 * Create Activity Handlers
 *
 *   Define which events to refresh
 *   the session on.
 *
 * @param handlers
 *************************************/
const createActivityHandlers = (handlers = defaultHandlers) => {
  handlers.forEach((handler) => {
    window.addEventListener(handler, activity, {capture: true, signal: handlers.signal});
  })
}
/*************************************
 * Create session update handler
 *
 *   Listens for when the session is
 *   refreshed.
 *
 *************************************/
const createSessionUpdateHandler = (handlers = defaultHandlers) => {
  document.addEventListener('sessionUpdated', setSessionExpCheck, {signal: handlers.signal});
}

const activity = () => {
  // console.log("[SessionMgr] activity(): Handler activated. Setting lastActivity to: ", getNowMillisec());
  lastActivity = getNowMillisec();
  // Uncomment the following to ensure the client session expires exactly X minutes after last activity...
  // ... where X is the session length defined by the server
  // refreshSession(false);   // This is turned off to reduce the number of session refresh calls.
}

// Countdown for session expiration
const getNewCountdown = (secondsLeft) => {
  secondsLeft = secondsLeft || getSessionExpSeconds() - getNowSec();
  return new Countdown({
    seconds: secondsLeft,  // number of seconds to count down (exp seconds - now seconds)
    onUpdateStatus: (sec) => {  // callback for each second
      timeToExpire.value = sec;
    },
    onCounterEnd: () => {
      endSession();
    }
  });
}

const isSessionExpiring = () => {
  return getNowSec() >= getSessionExpSeconds() - sessionExpBuffer;
}
/************************/
/*        Hooks         */
/************************/
onMounted(() => {
  // TODO: If we're not using session expiration, don't mount.
  // if (!usingSessionExp()) {
  //   console.log("[SessionMgr] Not using session expiration... mounting halted");
  //   return;
  // }

  createActivityHandlers();
  createSessionUpdateHandler();
  if (getNowSec() < getSessionExpSeconds() && isSessionExpiring()) {
    // console.log("[SessionMgr] refreshing session...");
    // We mounted with a session about to expire... refresh it.
    refreshSession(false);
  } else if (getSessionExp() > 0) {
    // console.log("[SessionMgr] Setting expiration check");
    // Otherwise, session is active and is greater than session expiration buffer... start timeout for expiration check.
    setSessionExpCheck();
  }
})
onDeactivated(() => {
  handlers.abort(); // Remove handlers
})
/************************/

/***************************************
 * Checks session for expiration
 *
 *  Called to handle an expiring session.
 ***************************************/
const sessionExpCheck = () => {
  // console.log("sessionExpCheck(): Called. " +
  //   "lastActivity (", new Date(lastActivity), ") > getSessionInit (", new Date(getSessionInit()),") = ", (lastActivity > getSessionInit()));
  // console.log("sessionExpCheck(): Difference in expiration time = ", lastActivity - getSessionInit());

  if (!isAuthenticated() || getSessionExp() < getNowSec()) {
    // Session is already expired... just end.
    endSession();
    return;
  }
  // If activity has been recorded since the last session refresh and we're still not expired, refresh it now.
  if (lastActivity > getSessionInit()) {
  // if (lastActivity > getSessionExp()) {
    // Activity detected... refresh session.
    refreshSession(false);
    return;
  }
  if (isSessionExpiring()) {
    // No activity since session created and session is about to expire... prompt user to continue.
    showDialog();
  }
  // Session is active... do nothing.
}

const showDialog = () => {
  timeToExpire.value = getSessionExpSeconds() - getNowSec();   // Get initial countdown value;

  if (timeToExpire.value < 0) {
    endSession();
    return;   // Negative time until session expiration... this should never happen, but just in case.
  }
  countdownInterval = getNewCountdown(timeToExpire.value);          // Setup a new countdown to exp time
  countdownInterval.start();                      // Start the countdown
  dialog.value = true;                            // Display the dialog
}

const endSessionClicked = () => {
  endSession();
}

const endSession = () => {
  dialog.value = false;
  countdownInterval?.stop();
  expireSession();
  emitCancel();
  router.push({name: 'login', replace: false}); // Update the URL and the history
}

const saveClicked = () => {
  showSpinner();
  refreshSession();
}

const showSpinner = () => {
  state.loading = true;
}

const hideSpinner = () => {
  state.loading = ref(false);
}

const refreshSession = async (showStatus = true) => {
  return authService.updateSession()
    .then((results) => {
      getConnectionSettings(true);
      if (showStatus) {
        snackbarText = "Success: Session extended";
        saveSnackbar.value = true;
      }
      emitRefreshed();
    })
    .catch((e) => {
      console.log(e);
      if (showStatus) {
        snackbarText = e;
        saveSnackbar.value = true;
      }
      emitCancel();
      return {};
    })
    .finally(() => {
      hideSpinner();
      if (countdownInterval) {
        countdownInterval.stop();
      }
      dialog.value = false;
    });
}
</script>

<style>


</style>
