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
      Reset Password
    </v-card-title>

    <form v-on:submit="onSubmit">
      <section id="login_messages" class="auth_messages" :class="{'success': !hasError}">
        {{ messages }}
      </section>
      <section>
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
          label="New Password"
          :error-messages="passwordErrors">
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
          name="confirm_password"
          id="confirm_password"
          autocomplete="off"
          label="Confirm New Password"
          :error-messages="confirmPasswordErrors">
        </v-text-field>

        <input id="token" name="token" type="hidden" :value="token">

        <v-divider></v-divider>

        <v-btn
          class="mb-8"
          size="large"
          variant="outlined"
          color=""
          block
          type="submit"
          id="button_passwordResetSubmit"
        >
          Set New Password
        </v-btn>

        <v-btn
          class="mb-8"
          size="large"
          variant="outlined"
          color=""
          block
          @click="this.$router.push('/login')"
          id="button_cancel"
        >
          Cancel
        </v-btn>
      </section>
    </form>

    <AltAuthLinks mode="resetPassword"></AltAuthLinks>
    <OAuthLinks></OAuthLinks>
  </v-card>
  </div>


</template>

<script lang="ts">
import {defineComponent} from 'vue';
import OAuthLinks from '@/components/authExtLinks.vue';
import AltAuthLinks from '@/components/authAltLinks.vue';
// @ts-ignore
import {getConnectionSettings} from '@/utils/appUtils';
import {AuthAPI, ResetPasswordRequest} from "@/services/auth";
// @ts-ignore
import {paths} from "@/utils/paths";
import router from "@/router";

const authService = new AuthAPI(getConnectionSettings()).auth;

class ResetPassword{
  password: FormDataEntryValue;
  confirm_password: FormDataEntryValue;
  token: FormDataEntryValue;

  constructor(formData: FormData) {
    this.password = formData.get('password') || "";
    this.confirm_password = formData.get('confirm_password') || "";
    this.token = formData.get('token') || "";
  }
}

export default defineComponent({
  name: 'ResetPasswordView',
  props: {
    msg: String
  },
  emits: ['signUpSuccess'],
  components: {
    OAuthLinks,
    AltAuthLinks
  },
  data() {
    return {
      hasError: true,
      messages: "",
      passwordErrors: "",
      confirmPasswordErrors: "",
      paths: paths,
      token: this.$route.query?.token || this.$route.params?.token || "",
      visible: false
    }
  },
  methods: {
    onSubmit(e: any) {
      e.preventDefault();

      this.hasError = true;
      this.messages = "";
      this.passwordErrors = "";

      if (!this.confirmPasswordsMatch(new FormData(e.target))) {
        this.messages = "Please confirm password entries match.";
        return false;
      }

      const resetPasswordReq = new ResetPassword(new FormData(e.target));
      authService.resetForgotPassword(<ResetPasswordRequest> resetPasswordReq)
        .then(() => {
          this.hasError = false;
          this.messages = "SUCCESS: Password Reset";

          getConnectionSettings(true); // Refresh auth cookie

          setTimeout(() => {
            router.push({name: 'home', replace: false}); // Update the URL and the history
          }, 1500);
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
      return form.get('password') === form.get('confirm_password');
    }
  }
})
</script>

<style scoped>
@import '../assets/styles/authForms2.css';
</style>
