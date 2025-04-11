<template>
  <div class="home">
    <ResetPassword></ResetPassword>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import ResetPassword from '@/components/ResetPassword.vue';

export default defineComponent({
  name: 'ResetPasswordView',
  components: {
    ResetPassword
  },
  data() {
    return {}
  },
  methods: {}
})
</script>

<style scoped>
</style>
