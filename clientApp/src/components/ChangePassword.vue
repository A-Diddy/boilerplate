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
      Change Password
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
          name="existing_password"
          id="existing_password"
          autocomplete="on"
          label="Existing Password"
          :error-messages="existingPasswordErrors">
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
          autocomplete="off"
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

        <v-divider></v-divider>

        <v-btn
          class="mb-8"
          size="large"
          variant="outlined"
          color=""
          block
          type="submit"
          id="button_passwordChangeSubmit"
        >
          Submit New Password
        </v-btn>

        <v-btn
          class="mb-8"
          size="large"
          variant="outlined"
          color=""
          block
          @click="this.$router.go(-1)"
          id="button_cancel"
        >
          Cancel
        </v-btn>
      </section>
    </form>
  </v-card>
  </div>


</template>

<script lang="ts">
import {defineComponent} from 'vue';
// @ts-ignore
import {getConnectionSettings} from '@/utils/appUtils';
import {AuthAPI, ChangePasswordRequest} from "@/services/auth";
// @ts-ignore
import router from "@/router";

const authService = new AuthAPI(getConnectionSettings()).auth;

class ChangePassword{
  existing_password: FormDataEntryValue;
  password: FormDataEntryValue;
  confirm_password: FormDataEntryValue;

  constructor(formData: FormData) {
    this.existing_password = formData.get('existing_password') || "";
    this.password = formData.get('password') || "";
    this.confirm_password = formData.get('confirm_password') || "";
  }
}

export default defineComponent({
  name: 'ChangePasswordView',
  props: {
    msg: String
  },
  emits: ['signUpSuccess'],
  components: {},
  data() {
    return {
      hasError: true,
      messages: "",
      existingPasswordErrors: "",
      passwordErrors: "",
      confirmPasswordErrors: "",
      visible: false
    }
  },
  methods: {
    onSubmit(e: any) {
      e.preventDefault();

      this.hasError = true;
      this.messages = "";
      this.existingPasswordErrors = "";
      this.passwordErrors = "";
      this.confirmPasswordErrors = "";

      if (!this.confirmPasswordsMatch(new FormData(e.target))) {
        this.messages = "Please confirm password entries match.";
        return false;
      }

      const changePasswordReq = new ChangePassword(new FormData(e.target));
      authService.changePassword(<ChangePasswordRequest> changePasswordReq)
        .then(() => {
          this.hasError = false;
          this.messages = "SUCCESS: Password Changed";

          // getConnectionSettings(true); // Refresh auth cookie

          setTimeout(() => {
            router.go(-1);
            // router.push({name: 'home', replace: false}); // Update the URL and the history
          }, 1500);
        })
        .catch((response: any) => {
          console.log("errors: ", response.body);
          const errors = response.body.errorMap;
          this.existingPasswordErrors = errors.existing_password?.join(" ") || "";
          this.passwordErrors = errors.password?.join(" ") || "";
          this.confirmPasswordErrors = errors.confirm_password?.join(" ") || "";
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
