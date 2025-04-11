/***********************
Main App
***********************/
<template>
  <div id="app">
    <h1 style="color:red">Hellow</h1>
    <HeaderComp></HeaderComp>
    <router-view/>
  </div>
</template>

<script setup>
import HeaderComp from '@/components/Header.vue';
import '@mdi/font/css/materialdesignicons.css';
import {getConnectionSettings, getPermissions} from '@/utils/appUtils';

// export default defineComponent({
//   name: 'HomeView',
//   components: {
//     HeaderComp,
//     Home
//   }
// })
// const App = () => {
// //////////////////////////////////////////

// Collect meta (config) data and assign it to GLOBAL_CONFIG
window.GLOBAL_CONFIG = window.GLOBAL_CONFIG || {};
window.GLOBAL_CONFIG.config = window.GLOBAL_CONFIG.config || {};
window.GLOBAL_CONFIG.config.user = window.GLOBAL_CONFIG.config.user || {};

// Query for any meta tags starting with 'app-'
const metaData = document.querySelectorAll('meta[name^="app-"]');

// Iterate over meta tag nodes and add each to the GLOBAL_CONFIG
metaData.forEach((meta) => {
  let val = null;
  if (meta.getAttribute('type') === 'object') {
    // Parse objects
    try {
      val = JSON.parse(meta.getAttribute('content'));
    } catch (e) {
      // console.log(e);
      val = {};
    }
  } else {
    // Default: Assume string value
    val = meta.getAttribute('content');
  }
  // Strip 'app-' prefix from meta name
  window.GLOBAL_CONFIG[meta.getAttribute('name')?.replace('app-', '')] = val;
});

console.log('window.GLOBAL_CONFIG (after meta tags): ', window.GLOBAL_CONFIG);

// Get any missing config from cookies and Construct the global 'connectionSettings'
getConnectionSettings();
getPermissions();   // This also refreshes the CSRF token (needed for SPA DEV mode since the app isn't served from the backend)

// //////////////////////////////////////////
// }
//
// export default App;
</script>

<style lang="scss">
@import './assets/styles/global.css';

html, body {
  /*background-color: black;*/
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #aaaaaa;
}

</style>
