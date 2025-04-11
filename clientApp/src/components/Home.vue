<template>
  <div class="hello">
    <v-parallax
      src="/img/vbanner.jpg"
      cover
      style="height: 100vh"
    >
      <div class="d-flex flex-column fill-height justify-center align-center text-white">
        <h1 class="subheading">
          <span>{{ msg }}</span>
        </h1>
      </div>
    </v-parallax>
  </div>
</template>

<script>
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'Home',
  components: {},
  props: {
    msg: String
  }
})
</script>

<style scoped lang="scss">

</style>
