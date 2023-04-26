<template>
  <div class="home">
    <ForgotPassword></ForgotPassword>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import ForgotPassword from '@/components/ForgotPassword.vue';

export default defineComponent({
  name: 'ForgotPasswordView',
  components: {
    ForgotPassword
  },
  data() {
    return {}
  },
  methods: {}
})
</script>

<style scoped>
</style>
