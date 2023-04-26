<template>
  <div class="home">
    <Home msg="Welcome">
      <img alt="logo" src="../assets/logo.png" class="logo" style="margin: 0 auto; max-width: 800px; ">
    </Home>
  </div>
</template>

<script lang="ts">
// @ts-ignore
import { defineComponent } from 'vue'
import Home from '@/components/Home.vue' // @ is an alias to /src
import HeaderComp from '@/components/Header.vue'

export default defineComponent({
  name: 'HomeView',
  components: {
    HeaderComp,
    Home
  }
})
</script>

<style scoped>
.logo {
  margin: 0 auto;
  max-width: 800px;
  width: 80vw;
}
</style>
