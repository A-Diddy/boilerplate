<template>
  <div class="prompt2 auth_container2" @click.stop>
    <v-card
      class="mx-auto pa-12 pb-8"
      style="margin: 20px;"
      elevation="16"
      max-width="520"
      rounded="lg"
    >
      <v-img
        class="mx-auto my-6"
        max-width="228"
        height="112"
        src="/img/logo.png"
      ></v-img>
      <v-card-title>
        Login
      </v-card-title>

      <form v-on:submit="onSubmit">
        <section id="login_messages" class="auth_messages">
          {{ messages }}
        </section>
        <section>
          <v-text-field
            density="compact"
            placeholder=""
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            name="username"
            id="username"
            autocomplete="on"
            label="Name"
            :error-messages="nameErrors">
          </v-text-field>
          <v-text-field
            density="compact"
            placeholder=""
            prepend-inner-icon="mdi-email-outline"
            variant="outlined"
            name="email"
            id="email"
            autocomplete="on"
            label="Email"
            :error-messages="emailErrors">
          </v-text-field>

          <v-text-field
            :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
            :type="visible ? 'text' : 'password'"
            @click:append-inner="visible = !visible"
            type="password"
            density="compact"
            placeholder=""
            prepend-inner-icon="mdi-lock-outline"
            variant="outlined"
            name="password"
            id="password"
            autocomplete="current-password"
            label="Password"
            :error-messages="passwordErrors">
          </v-text-field>

          <v-btn
            class="mb-8"
            size="large"
            variant="outlined"
            color=""
            block
            id="button_login"
            type="submit"
          >
            Log In
          </v-btn>
        </section>

      </form>

<!--      <section>
        <v-btn
          class="mb-8"
          size="large"
          variant="outlined"
          color=""
          block
          id="button_login"
          type="submit"
          @click="isModal ? setView('forgotPassword') : goToPath('/forgot_password')"
        >
          Reset password
        </v-btn>

        <v-btn
          class="mb-8"
          size="large"
          variant="outlined"
          color=""
          block
          id="button_login"
          type="submit"
          @click="isModal ? setView('signup') : goToPath(`/signup${$route.query.path ? '?path='+$route.query.path : $props.static ? '?path='+$route.fullPath : ''}`)"
        >
          Sign up
        </v-btn>
      </section>-->

      <section class="authLinks mt-4">
        <v-card-text class="text-center">

          <v-banner
            lines="one"
          >
            <template v-slot:text>
              Don't have an account?
            </template>
            <template v-slot:actions>
              <v-btn
                @click="isModal ? setView('signup') : goToPath(`/signup${$route.query.path ? '?path='+$route.query.path : $props.static ? '?path='+$route.fullPath : ''}`)"
              >
                Sign up
              </v-btn>
            </template>
          </v-banner>

          <v-banner
            lines="one"
          >
            <template v-slot:text>
              Forgot password?
            </template>
            <template v-slot:actions>
              <v-btn @click="isModal ? setView('forgotPassword') : goToPath('/forgot_password')">
                Reset password
              </v-btn>
            </template>
          </v-banner>
          <!--
                    <p class="help">
                      Don't have an account?
                      <v-btn v-if="isModal" onclick="setView('signup')">Sign up</v-btn>
                      <v-btn v-else
                             :to="`/signup${$route.query.path ? '?path='+$route.query.path : $props.static ? '?path='+$route.fullPath : ''}`">Sign up</v-btn>
                    </p>
                    <p class="help">
                      Forgot password?
                      <v-btn v-if="isModal" onclick="setView('forgotPassword')">Reset password</v-btn>
                      <v-btn v-else to="/forgot_password">Reset password</v-btn>
                    </p>-->
        </v-card-text>
      </section>
      <v-card
        class="mb-12"
        color="surface-variant"
        variant="plain"
      >
        <div class="mt-4">
          <a class="button social google active" :href="paths.signin_google + getQueryString()">
            <span></span>
            <v-icon>mdi-google</v-icon>
            <span>Sign in with Google</span>
          </a>
          <a class="button social linkedin active" :href="paths.signin_linkedin + getQueryString()">
            <v-icon>mdi-linkedin</v-icon>
            <span>Sign in with LinkedIn</span>
          </a>
          <a class="button social facebook active" :href="paths.signin_facebook + getQueryString()">
            <v-icon>mdi-facebook</v-icon>
            <span>Sign in with Facebook</span>
          </a>
          <a class="button social apple active" :href="paths.signin_apple + getQueryString()">
            <v-icon>mdi-apple</v-icon>
            <span>Sign in with Apple</span>
          </a>
        </div>
      </v-card>
    </v-card>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
// @ts-ignore
import {getConnectionSettings} from '@/utils/appUtils';
import {AuthAPI, LoginRequest} from "@/services/auth";
import router from "@/router";
// @ts-ignore
import {paths} from "@/utils/paths";

const authService = new AuthAPI(getConnectionSettings()).auth;

class Login {
  email: FormDataEntryValue;
  username: FormDataEntryValue;
  password: FormDataEntryValue;

  constructor(formData: FormData) {
    this.email = formData.get('email') || "";
    this.username = formData.get('username') || "";
    this.password = formData.get('password') || "";
  }
}

export default defineComponent({
  name: 'Login',
  props: {
    msg: String,
    static: Boolean,
    isModal: Boolean,
    selectedView: String,
    modelValue: String
  },
  emits: ['loginSuccess', 'update:modelValue'],
  components: {},
  mounted() {
    if (this.$route.query?.msg) {
      // Support for either a single string or array of strings in the 'msgs' query string param.
      const msgs = typeof this.$route.query.msg === 'string' ? this.$route.query.msg : this.$route.query.msg.join(",");
      this.messages = msgs;
    }
  },
  data() {
    return {
      messages: typeof this.$route.query.msg === 'string' ? this.$route.query.msg : this.$route.query.msg?.join(",") || "",
      nameErrors: "",
      emailErrors: "",
      passwordErrors: "",
      paths: paths,
      oAuthQS: "",
      visible: false
    }
  },
  methods: {
    setView(view: string) {
      this.$emit('update:modelValue', view);
    },
    onSubmit(e: any) {
      e.preventDefault();

      this.messages = "";
      this.nameErrors = "";
      this.emailErrors = "";
      this.passwordErrors = "";

      const loginReq = new Login(new FormData(e.target));

      authService.login(<LoginRequest>loginReq)
        .then(() => {
          getConnectionSettings(true); // Refresh auth cookie

          if (this.isModal) {  // Modals handle themselves
            this.$emit("loginSuccess");
          } else if (this.$route.query?.path) { // Else if a path is provided, go to it.
            const path = typeof this.$route.query.path === 'string' ? this.$route.query.path : JSON.stringify(this.$route.query.path[0]);
            router.push(path);
          } else {                          // Otherwise, go to home.
            router.push({name: 'home', replace: false}); // Update the URL and the history
          }
        })
        .catch((response: any) => {
          this.messages = `${response.body.name}: ${response.body.description}`;
          return e;
        });

      return false;
    },
    getQueryString() {
      let qs = this.oAuthQS;
      if (qs) {
        return qs;  // If the query string was already built, use it.
      }
      // Otherwise, build the query string.
      qs = "?";
      if (this.$route.query?.path) {    // If a path is provided, include it.
        qs += `next_url=${this.$route.query.path}`;
      }
      if (this.$route.query?.token || this.$route.query?.path?.includes("token")) {    // If a token is provided, include it.
        if (qs.includes('=')) qs += '&';    // If we added a previous param, include the '&' to separate this one.
        const token = this.$route.query?.token || this.$route.query?.path?.toString().split("token=")[1].split("&")[0];
        qs += `invite_token=${token}`;
      }
      return this.oAuthQS = qs;   // Save the built query string (so we don't build for each oAuth provider)
    },
    goToPath(inPath = "/") {
      this.$router.push(inPath);
    }
  }
})
</script>

<style scoped>
@import '../assets/styles/authForms2.css';
@import "@fontsource/roboto";

a {
  text-decoration: none;
  cursor: pointer;
}

a.social {
  color: white;
  text-align: left;
  transition: filter, background-color .5s;
}

a.social:hover {
  z-index: 1;
}

a.social i.v-icon {
  margin-right: 22px;
  transition: margin .5s;
  vertical-align: text-bottom;
}

.social span {
  font-size: 16px;
  transition: vertical-align .5s;
  vertical-align: center;
}

/*************************************************************/
/* https://developers.google.com/identity/branding-guidelines */
/*************************************************************/
a.google {
  /*background-color: #4285f4;*/
  /*background-color: #34a853;*/
  /*background-color: #fbbc05;*/
  /*background-color: #ea4335;*/
}

a.google:hover {
  font-family: Roboto-Medium, Roboto, Helvetica, Arial, sans-serif;
  font-weight: 500;
  color: #757575;
  box-shadow: 0px 2px 3px rgba(0, 0, 0, .33);
  background: url('/public/img/icons/btn_google_light_normal_ios.svg') white no-repeat;
  background-size: contain;
}

a.google:hover i.v-icon {
  visibility: hidden;
}

/*************************************************************/
/* https://brand.linkedin.com/en-us */
/*************************************************************/
.linkedin {
  background-color: #0a66c2;
}

a.linkedin:hover {
  background-color: #006097;
}

/*************************************************************/
/* */
/*************************************************************/
.facebook {
  background-color: #1877f2;
}

/*************************************************************/
/* https://developer.apple.com/design/human-interface-guidelines/technologies/sign-in-with-apple/# */
/*************************************************************/
.apple {
  background-color: black;
}

a.apple:hover {
  color: black;
  background-color: white;
  box-shadow: 0 0 1px 1px rgb(83, 83, 83);
}

/*
a.apple:hover span {
  vertical-align: sub;
  vertical-align: sub;
  font-weight: 600;
  font-size: 18px;
}
*/

/*a.apple:hover i.v-icon {
  font-size: 17px;
  vertical-align: sub;
  margin-left: 23%;
  margin-right: 5px;
}*/
</style>
