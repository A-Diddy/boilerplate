<template>
  <div class="home">
    <EmailVerify></EmailVerify>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import EmailVerify from '@/components/EmailVerify.vue';

export default defineComponent({
  name: 'EmailVerifyView',
  components: {
    EmailVerify
  },
  data() {
    return {}
  },
  methods: {}
})
</script>

<style scoped>
</style>
