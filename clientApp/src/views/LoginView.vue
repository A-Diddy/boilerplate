<template>
  <h1 style="color:red; height: 100px;">Hello</h1>

  <div class="home">
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
