<template>
  <div class="container_profile">
    <Suspense>
      <Profile/>
    </Suspense>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { FormKit, FormKitSchema } from '@formkit/vue';
import '@formkit/themes/genesis';
// import EditProfile from "@/components/EditProfile.vue";
import Profile from "@/components/Profile.vue";

export default defineComponent({
  name: 'ProfileComp',
  components: {
    Profile
  },
  props: {
    msg: String
  },
  data () {
    return {
      user: 'Default',
      token: 'default',
      // profile: {name: 'Test ING', username: "some name"},
      formSchema: editProfileSchema
      // ,handleClick: handleClick
    }
  },
  created () {
    // Load meta config from server
    this.user = window['GLOBAL_CONFIG']?.user || 'Devmon';
    this.token = window['GLOBAL_CONFIG']?.token || 'Tokemon';
  },
  methods: {
    handleClick() {
      console.log("profile: ", this.profile);
    },
    getFormSchema() {
      return editProfileSchema
    },
  },
  computed: {
    profile: {
      get(): any {
      },
      set() {
      }
    }
  }
});

const editProfileSchema = <any> [
  {
    $el: 'h1',
    children: 'Edit Profile'
  },
  {
    $cmp: 'FormKit',
    props: {
      type: 'form',
      id: 'form',
      onSubmit: '$handleClick',
      plugins: '$plugins',
      actions: false,
    },
    children: [
      {
        $formkit: 'text',
        name: 'name',
        label: 'Name',
        bind: '$data.profile',
        props: {
          value: '$name'
        },
        help: 'Username (up to 20 characters)',
        validation: "required|matches:/^@[a-zA-Z]+$/|length:1,20"
      }, {
        $el: 'button',
        id: 'button_profile_submit',
        attrs: {
          onClick: '$handleClick'
        },
        children: 'Submit',
        class: 'button'
      }
    ]
  }
];
</script>

<style>
.container_profile {
  margin: 0 auto;
}
</style>
