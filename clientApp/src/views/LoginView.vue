<template>
  <div class="home2">
    <Login></Login>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import Login from '@/components/Login.vue';

export default defineComponent({
  name: 'LoginView',
  components: {
    Login
  },
  data() {
    return {}
  },
  methods: {}
})
</script>

<style scoped>
  .black {
    background-color: black;
  }
</style>
