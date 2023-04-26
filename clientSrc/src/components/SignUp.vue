<template>
  <div class="prompt auth_container">
    <img alt="logo" src="../assets/logo.png" class="logo" style="margin: 0 auto; max-width: 80%; ">
    <h1>Sign up</h1>
    <form v-on:submit="onSubmit">
      <section id="signup_messages" class="auth_messages">
        {{ messages }}
      </section>
      <section>
        <label for="name">Name</label>
        <input id="name" name="name" type="input" autocomplete="name" required>
        <div id="name_messages" class="auth_messages">
          {{ nameErrors }}
        </div>
      </section>
      <section>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="username" required>
        <div id="email_messages" class="auth_messages">
          {{ emailErrors }}
        </div>
      </section>
      <section>
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="password" required>
        <div id="password_messages" class="auth_messages">
          {{ passwordErrors }}
        </div>
      </section>
      <button type="submit">Sign up</button>
    </form>
    <section>
      <p class="help">Already have an account? <router-link to="/login">Login</router-link></p>
      <p class="help">Forgot password? <router-link to="/forgot_password">Reset password</router-link></p>
    </section>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
// @ts-ignore
import {getConnectionSettings} from '@/utils/appUtils';
import {AuthAPI, SignupRequest} from "@/services/auth";
import router from "@/router";
// @ts-ignore
import {paths} from "@/utils/paths";

const authService = new AuthAPI(getConnectionSettings()).auth;

class SignUp {
  name: FormDataEntryValue;
  email: FormDataEntryValue;
  password: FormDataEntryValue;

  constructor(formData: FormData) {
    this.name = formData.get('name') || "";
    this.email = formData.get('email') || "";
    this.password = formData.get('password') || "";
  }
}

window["GLOBAL_CONFIG"] = window["GLOBAL_CONFIG"] || {};

export default defineComponent({
  name: 'SignUpView',
  props: {
    msg: String
  },
  emits: ['signUpSuccess'],
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

      const signUpReq = new SignUp(new FormData(e.target));
      authService.signup(<SignupRequest> signUpReq)
        .then(() => {
          router.push({name: 'home', replace: false}); // Update the URL and the history
        })
        .catch((response: any) => {
          console.log("errors: ", response.body);
          const errors = response.body.errors;
          this.nameErrors = errors.name?.join(" ") || "";
          this.emailErrors = errors.email?.join(" ") || "";
          this.passwordErrors = errors.password?.join(" ") || "";
          this.messages = `${response.body.name}: ${response.body.description || ""}`;
          return response;
        });

      return false;
    }
  }
})
</script>

<style scoped>
@import '../assets/styles/authForms.css';
</style>
