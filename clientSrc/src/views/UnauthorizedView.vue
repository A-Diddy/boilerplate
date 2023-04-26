<template>
  <div class="home">
    <Unauthorized></Unauthorized>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import Unauthorized from '@/components/Unauthorized.vue';

export default defineComponent({
  name: 'UnauthorizedView',
  components: {
    Unauthorized
  },
  data() {},
  methods: {}
})
</script>

<style scoped>
</style>
