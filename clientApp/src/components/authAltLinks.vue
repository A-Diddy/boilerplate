<template>
  <v-banner
    v-if="mode === 'signup'"
    lines="one"
  >
    <template v-slot:text>
      Already have an account?
    </template>
    <template v-slot:actions>
      <v-btn
        variant="elevated"
        @click="isModal ? setView('login') : goToPath(`/login${$route.query.path ? '?path='+$route.query.path : $props.static ? '?path='+$route.fullPath : ''}`)"
      >
        Login
      </v-btn>
    </template>
  </v-banner>

  <v-banner
    v-if="mode !== 'signup' || mode === 'resetPassword'"
    lines="one"
  >
    <template v-slot:text>
      Don't have an account?
    </template>
    <template v-slot:actions>
      <v-btn
        variant="elevated"
        @click="isModal ? setView('signup') : goToPath(`/signup${$route.query.path ? '?path='+$route.query.path : $props.static ? '?path='+$route.fullPath : ''}`)"
      >
        Sign up
      </v-btn>
    </template>
  </v-banner>

  <v-banner
    v-if="mode !== 'resetPassword'"
    lines="one"
  >
    <template v-slot:text>
      Forgot password?
    </template>
    <template v-slot:actions>
      <v-btn
        variant="elevated"
        @click="isModal ? setView('forgotPassword') : goToPath('/forgot_password')">
        Reset password
      </v-btn>
    </template>
  </v-banner>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'AltAuthLinks',
  props: {
    isModal: Boolean,
    modelValue: String,
    mode: String
  },
  emits: ['update:modelValue'],
  components: {},
  mounted() {},
  data() {
    return {}
  },
  methods: {
    setView(view: string) {
      this.$emit('update:modelValue', view);
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
