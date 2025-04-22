<template>
  <div class="prompt auth_container">
    <h1>Forgot Password</h1>
    <form v-on:submit="onSubmit">
      <section id="forgotPassword_messages" class="auth_messages">
        {{ messages }}
      </section>
      <section>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="username" required>
        <div id="email_messages" class="auth_messages">
          {{ emailErrors }}
        </div>
      </section>
      <button type="submit">Send Reset Link</button>
    </form>
    <p class="help">Already have an account? <router-link to="/login">Login</router-link></p>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
// @ts-ignore
import {getConnectionSettings} from '@/utils/appUtils';
import {AuthAPI, SendForgotPasswordRequest} from "@/services/auth";
import {paths} from "@/utils/paths";

const authService = new AuthAPI(getConnectionSettings()).auth;


class ForgotPassword {
  email: FormDataEntryValue;

  constructor(formData: FormData) {
    this.email = formData.get('email') || "";
  }
}

export default defineComponent({
  name: 'ForgotPasswordView',
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

      const forgotPasswordReq = new ForgotPassword(new FormData(e.target));
      authService.sendForgotPassword(<SendForgotPasswordRequest> forgotPasswordReq)
        .then(() => {
          this.messages = "An email has been sent with further instructions."
          // router.push({name: 'home', replace: false}); // Update the URL and the history
        })
        .catch((response: any) => {
          console.log("errors: ", response.body);
          const errors = response.body.errors;
          this.emailErrors = errors.email?.join(" ") || "";
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
