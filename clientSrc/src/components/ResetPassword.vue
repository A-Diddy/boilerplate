<template>
  <div class="prompt auth_container">
    <h1>Reest Password</h1>
    <form v-on:submit="onSubmit">
      <section id="resetPassword_messages" class="auth_messages">
        {{ messages }}
      </section>
      <section>
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="password" required>
        <div id="password_messages" class="auth_messages">
          {{ passwordErrors }}
        </div>
      </section>
      <section>
        <label for="confirmPassword">Password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" required>
        <div id="confirm_password_messages" class="auth_messages">
          {{ confirmPasswordErrors }}
        </div>
      </section>
      <section>
        <input id="token" name="token" type="hidden" :value="token">
      </section>
      <button type="submit">Set New Password</button>
    </form>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
// @ts-ignore
import {getConnectionSettings} from '@/utils/appUtils';
import {AuthAPI, ResetPasswordRequest} from "@/services/auth";
// @ts-ignore
import {paths} from "@/utils/paths";

const authService = new AuthAPI(getConnectionSettings()).auth;

class ResetPassword {
  password: FormDataEntryValue;
  token: FormDataEntryValue;

  constructor(formData: FormData) {
    this.password = formData.get('password') || "";
    this.token = formData.get('token') || "";
  }
}

export default defineComponent({
  name: 'ResetPasswordView',
  props: {
    msg: String
  },
  emits: ['signUpSuccess'],
  components: {},
  data() {
    return {
      messages: "",
      passwordErrors: "",
      confirmPasswordErrors: "",
      paths: paths,
      token: this.$route.query?.token || ""
    }
  },
  methods: {
    onSubmit(e: any) {
      e.preventDefault();

      this.messages = "";
      this.passwordErrors = "";

      if (!this.confirmPasswordsMatch(new FormData(e.target))) {
        this.messages = "Please confirm password entries match.";
        return false;
      }

      const resetPasswordReq = new ResetPassword(new FormData(e.target));
      authService.resetForgotPassword(<ResetPasswordRequest> resetPasswordReq)
        .then(() => {
          this.messages = "Password reset success";
        })
        .catch((response: any) => {
          console.log("errors: ", response.body);
          const errors = response.body.errors;
          this.passwordErrors = errors.password?.join(" ") || "";
          this.messages = `${response.body.name}: ${response.body.description || ""}`;
          this.messages += errors.token?.join(" ") || "";
          return response;
        });

      return false;
    },
    confirmPasswordsMatch(form: FormData) {
      return form.get('password') === form.get('confirmPassword');
    }
  }
})
</script>

<style scoped>
@import '../assets/styles/authForms.css';
</style>
