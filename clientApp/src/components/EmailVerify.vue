<template>
  <div class="prompt auth_container">
    <h1>Email Verification</h1>
    <section id="resetPassword_messages" class="auth_messages">
      {{ messages }}
    </section>
    <section v-if="verified" id="resetPassword_messages" class="verified_messages">
      <span>
        <p>Thank you. You're email has been verified.</p>
        <router-link to="/">
          <p>Please click to here continue</p>
        </router-link>
      </span>
    </section>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
// @ts-ignore
import {getConnectionSettings} from '@/utils/appUtils';
import {AuthAPI, EmailVerifyRequest} from "@/services/auth";
// @ts-ignore
import {paths} from "@/utils/paths";

const authService = new AuthAPI(getConnectionSettings()).auth;

export default defineComponent({
  name: 'EmailVerifyView',
  props: {
    msg: String
  },
  data() {
    return {
      messages: "",
      verified: false
    }
  },
  mounted() {
    this.verified = false;
    this.messages = "";
    authService.verifyEmail(<EmailVerifyRequest>{token: this.$route.query?.token || ""})
      .then(() => {
        this.verified = true;
      })
      .catch((response: any) => {
        console.log("errors: ", response.body);
        const errors = response.body.errors;
        this.messages = `${response.body.name}: ${response.body.description || ""}`;
        this.messages += errors.token?.join(" ") || "";
        return response;
      });

    return false;
  }
})
</script>

<style scoped>
@import '../assets/styles/authForms.css';
</style>
