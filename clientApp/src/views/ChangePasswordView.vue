<template>
  <div class="home">
    <ChangePassword></ChangePassword>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import ChangePassword from '@/components/ChangePassword.vue';

export default defineComponent({
  name: 'ChangePasswordView',
  components: {
    ChangePassword
  },
  data() {
    return {}
  },
  methods: {}
})
</script>

<style scoped>
</style>
