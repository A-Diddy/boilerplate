<template>
  <v-card
    class="mb-12"
    color="surface-variant"
    variant="plain"
  >
    <div class="mt-4">
      <a class="button social google active" :href="paths.signin_google + oAuthQS">
        <span></span>
        <v-icon>mdi-google</v-icon>
        <span>Sign in with Google</span>
      </a>
      <a class="button social linkedin active" :href="paths.signin_linkedin + oAuthQS">
        <v-icon>mdi-linkedin</v-icon>
        <span>Sign in with LinkedIn</span>
      </a>
      <a class="button social facebook active" :href="paths.signin_facebook + oAuthQS">
        <v-icon>mdi-facebook</v-icon>
        <span>Sign in with Facebook</span>
      </a>
      <a class="button social apple active" :href="paths.signin_apple + oAuthQS">
        <v-icon>mdi-apple</v-icon>
        <span>Sign in with Apple</span>
      </a>
    </div>
  </v-card>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from "@/utils/paths";
// @ts-ignore
import {getQueryString} from '@/utils/appUtils.js'

export default defineComponent({
  name: 'OAuthLinks',
  props: {},
  emits: [],
  components: {},
  data() {
    return {
      paths: paths,
      oAuthQS: getQueryString(this.$route.query)
    }
  },
  methods: {
    goToPath(inPath = "/") {
      this.$router.push(inPath);
    }
  },
  mounted() {},
})
</script>

<style scoped>
@import '../assets/styles/authForms2.css';
@import "@fontsource/roboto";

</style>
