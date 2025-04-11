<template>
  <div class="home">
    <SignUp></SignUp>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import SignUp from '@/components/SignUp.vue';

export default defineComponent({
  name: 'SignupView',
  components: {
    SignUp
  },
  data() {
    return {}
  },
  methods: {}
})
</script>

<style scoped>
</style>
