<template>
  <div class="prompt auth_container">
    <h1>Login</h1>
    <form v-on:submit="onSubmit">
      <section id="login_messages" class="auth_messages">
        {{ messages }}
      </section><section>
      <label for="username">Username</label>
      <input id="username" name="username" type="text" autocomplete="username" required>
      <div id="username_messages" class="auth_messages">
        {{ messages }}
      </div>
    </section>
<!--      <section>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="username" required>
        <div id="email_messages" class="auth_messages">
          {{ emailErrors }}
        </div>
      </section>-->
      <section>
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="password" required>
        <div id="password_messages" class="auth_messages">
          {{ passwordErrors }}
        </div>
      </section>
      <button type="submit">Login</button>
    </form>
    <section>
      <p class="help">Don't have an account? <router-link to="/signup">Sign up</router-link></p>
      <p class="help">Forgot password? <router-link to="/forgot_password">Reset password</router-link></p>
    </section>
  </div>
  <div>
    <section class="prompt">
      <a class="button social google active" :href="paths.signin_google">Sign in with Google</a>
      <a class="button social linkedin active" :href="paths.signin_linkedin">Sign in with LinkedIn</a>
      <a class="button social facebook active" :href="paths.signin_facebook">Sign in with Facebook</a>
      <a class="button social apple active" :href="paths.signin_apple">Sign in with Apple</a>
    </section>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
// @ts-ignore
import {getConnectionSettings, getPermissions} from '@/utils/appUtils';
import {AuthAPI, LoginRequest} from "@/services/auth";
import router from "@/router";
// @ts-ignore
import {paths} from "@/utils/paths";

const authService = new AuthAPI(getConnectionSettings()).auth;

class Login {
  username: FormDataEntryValue;
  // email: FormDataEntryValue;
  password: FormDataEntryValue;

  constructor(formData: FormData) {
    this.username = formData.get('username') || "";
    // this.email = formData.get('email') || "";
    this.password = formData.get('password') || "";
  }
}

export default defineComponent({
  name: 'Login',
  props: {
    msg: String
  },
  emits: ['loginSuccess'],
  components: {},
  data() {
    return {
      messages: "",
      nameErrors: "",
      emailErrors: "",
      passwordErrors: "",
      paths: paths
    }
  },
  methods: {
    onSubmit(e: any) {
      e.preventDefault();

      this.messages = "";
      this.nameErrors = "";
      this.emailErrors = "";
      this.passwordErrors = "";

      const loginReq = new Login(new FormData(e.target));
      authService.login(<LoginRequest>loginReq)
        .then(() => {
          getConnectionSettings(true);    // Refresh auth cookie
          getPermissions();               // Refresh permissions with new session
          router.push({name: 'home', replace: false}); // Update the URL and the history
        })
        .catch((response: any) => {
          this.messages = `${response.body.name}: ${response.body.description}`;
          return e;
        });

      return false;
    },
    activateSession(token = "xyz") {
      window["GLOBAL_CONFIG"].token = token;
      const sessionActivatedEvent = new CustomEvent('sessionActivated', {detail: {token}});
      document.dispatchEvent(sessionActivatedEvent);
    }
  }
})
</script>

<style scoped>
@import '../assets/styles/authForms.css';
</style>
