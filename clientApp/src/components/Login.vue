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
            label="Username"
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

      <AltAuthLinks :is-modal="isModal"></AltAuthLinks>
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
import {AuthAPI, LoginRequest} from "@/services/auth";
import router from "@/router";

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
  components: {
    OAuthLinks,
    AltAuthLinks
  },
  props: {
    msg: String,
    static: Boolean,
    isModal: Boolean,
    selectedView: String,
    modelValue: String
  },
  emits: ['loginSuccess', 'update:modelValue'],
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
      usernameErrors: "",
      emailErrors: "",
      passwordErrors: "",
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
      this.usernameErrors = "";
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
          console.log("errors: ", response.body);
          const errors = response.body.errorMap;
          this.usernameErrors = errors.username?.join(" ") || "";
          this.emailErrors = errors.email?.join(" ") || "";
          this.passwordErrors = errors.password?.join(" ") || "";
          this.messages = `${response.body.name}: ${response.body.description || ""}`;
          return response;
        });

      return false;
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

</style>
