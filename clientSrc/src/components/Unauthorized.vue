<template>
  <div class="prompt auth_container">
    <h1>Unauthorized</h1>
    <p>The page requested does not exist or you are unauthorized to view it.</p>
    <br />
    <div>
      {{msg}}
    </div>
    <br />
    <div>
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
export default defineComponent({
  name: 'Unauthorized',
  props: {
    msg: String
  },
  emits: [],
  components: {},
  data() {},
  methods: {}
})
</script>

<style scoped>
@import '../assets/styles/authForms.css';
</style>
