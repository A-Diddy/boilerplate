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
        Sign Up
      </v-card-title>

      <form v-on:submit="onSubmit">
        <section id="signup_messages" class="auth_messages">
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
            label="Username"
            required
            :error-messages="usernameErrors">
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
            required
            type="email"
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
            required
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
            Sign Up
          </v-btn>
        </section>
      </form>

      <AltAuthLinks :is-modal="this.$props.isModal" mode="signup"></AltAuthLinks>
      <OAuthLinks></OAuthLinks>
    </v-card>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
// @ts-ignore
import {getConnectionSettings} from '@/utils/appUtils';
import {AuthAPI, SignupRequest} from "@/services/auth";
import OAuthLinks from '@/components/authExtLinks.vue';
import AltAuthLinks from '@/components/authAltLinks.vue';
import router from "@/router";
// @ts-ignore
import {paths} from "@/utils/paths";

const authService = new AuthAPI(getConnectionSettings()).auth;

class SignUp {
  username: FormDataEntryValue;
  email: FormDataEntryValue;
  password: FormDataEntryValue;

  constructor(formData: FormData) {
    this.username = formData.get('username') || "";
    this.email = formData.get('email') || "";
    this.password = formData.get('password') || "";
  }
}

window["GLOBAL_CONFIG"] = window["GLOBAL_CONFIG"] || {};

export default defineComponent({
  name: 'SignUpView',
  props: {
    msg: String,
    isModal: Boolean
  },
  emits: ['signUpSuccess'],
  components: {
    OAuthLinks,
    AltAuthLinks
  },
  data() {
    return {
      messages: "",
      usernameErrors: "",
      emailErrors: "",
      passwordErrors: "",
      paths: paths,
      visible: false
    }
  },
  mounted() {},
  methods: {
    onSubmit(e: any) {
      e.preventDefault();

      this.messages = "";
      this.usernameErrors = "";
      this.emailErrors = "";
      this.passwordErrors = "";

      const signUpReq = new SignUp(new FormData(e.target));
      authService.signup(<SignupRequest> signUpReq)
        .then(() => {
          getConnectionSettings(true); // Refresh auth cookie

          if (this.isModal) {  // Modals handle themselves
            this.$emit("signUpSuccess");
          } else if (this.$route.query?.path) { // Else if a path is provided, go to it.
            const path = typeof this.$route.query.path === 'string' ? this.$route.query.path : JSON.stringify(this.$route.query.path[0]);
            router.push(path);
          } else {                          // Otherwise, go to home.
            router.push({name: 'home', replace: false}); // Update the URL and the history
          }
        })
        .catch((response: any) => {
          console.log("errors: ", response.body);
          const errors = response.body.errorMap;
          this.usernameErrors = errors.username?.join(" ") || "";
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
@import '../assets/styles/authForms2.css';
</style>
