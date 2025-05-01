<template>
  <v-toolbar
    dark
    prominent
    density="comfortable"
    :elevation="8"
  >

    <!-- Mobile menu -->
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-app-bar-nav-icon v-bind="props"></v-app-bar-nav-icon>
      </template>
      <v-list  id="mobileList_accountMenu">
        <v-list-item @click="this.$router.push('/')">
          <v-list-item-title>Home</v-list-item-title>
        </v-list-item>
        <v-list-item @click="this.$router.push('/profile')">
          <v-list-item-title>Profile</v-list-item-title>
        </v-list-item>
        <!--        <v-list-item @click="this.$router.push('/gigs')">
                  <v-list-item-title>Gigs</v-list-item-title>
                </v-list-item>
                  <v-list-item @click="this.$router.push('/o/17fd04e2-e9ac-40d3-b745-a297c57146d7')">
                  <v-list-item-title>Onboarding</v-list-item-title>
                </v-list-item>-->
      </v-list>
    </v-menu>

    <v-toolbar-title>
      <span style="float:left">
      {{ title }}
      </span>
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <!--    <div id="gigsActions" class="gigsActions">
          <div>
            <router-link to="/gig">
              <v-btn>
                Create Requisition
              </v-btn>
            </router-link>
          </div>
        </div>-->


    <!-- Main menu -->
    <v-tabs v-model="model">
      <v-tab to="/">Home</v-tab>
      <v-tab to="/profile">Profile</v-tab>
    </v-tabs>

    <!-- TODO: Search option -->
    <!--    <v-btn icon>
          <v-icon>mdi-magnify</v-icon>
        </v-btn>-->

    <!-- Profile drop down menu -->
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" id="button_userAvatar">
          <v-avatar  id="avatar_userAvatar">
            <v-img src="/img/sampleProfilePic.png" alt="Profile picture"></v-img>
          </v-avatar>
        </v-btn>
      </template>

      <v-list id="list_accountMenu">
        <v-list-item style="vertical-align: bottom">
          <v-list-item-title class="menuItem_user">
            <span class="user">  {{ user }}</span>
            <v-avatar style="float:right" id="listItem_userAvatar">
              <v-img src="/img/sampleProfilePic.png" alt="Profile picture">
              </v-img>
            </v-avatar>
          </v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="authenticated"
          @click="this.$router.push('/profile')">
          <v-icon icon="mdi-account-edit"></v-icon>
          Edit profile
        </v-list-item>
        <v-list-item
          v-if="authenticated"
          @click="this.$router.push('/change_password')">
          <v-icon icon="mdi-lock"></v-icon>
<!--          <a href="/changePassword">-->
            Change Password
<!--          </a>-->
        </v-list-item>
        <v-list-item
          v-if="!authenticated"
          @click="login()">
          <v-icon icon="mdi-login"></v-icon>
          Sign in
        </v-list-item>
        <v-list-item
          v-if="authenticated"
          @click="logout()">
          <v-icon icon="mdi-logout"></v-icon>
          Sign out
        </v-list-item>
      </v-list>
    </v-menu>
  </v-toolbar>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
// @ts-ignore
import {getUserName, getToken} from "@/utils/appUtils.js";
// @ts-ignore
import {isAuthenticated} from "@/utils/appUtils.js";

export default defineComponent({
  name: 'HeaderComp',
  props: {
    msg: String
  },
  data() {
    return {
      title: import.meta.env.VITE_APP_TITLE,
      user: 'Default',
      token: 'default',
      model: null,
      authenticated: false
    }
  },
  created() {
    this.token = getToken();
    this.sessionUpdated();
    document.addEventListener('sessionUpdated', this.sessionUpdated);
    console.log('token: ', this.token);
    console.log('user: ', this.user);
    console.log("router = ", this.$router);
  },
  unmounted() {
    document.removeEventListener('sessionUpdated', this.sessionUpdated)
  },
  methods: {
    async logout() {
      this.$router.push('/logout')
    },
    async login() {
      this.$router.push('/login')
    },
    sessionUpdated() {
      this.user = getUserName();
      this.authenticated = isAuthenticated();
    }
  }
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

a {
  text-decoration: none;
  color: #ffffff;
}

.v-btn--variant-plain, .v-btn--variant-outlined, .v-btn--variant-text, .v-btn--variant-tonal {
  color: #ffffff;
}

:deep(div.v-tab__slider) {
  background-color: #fd5a1e;
}

.menuItem_user {
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-content: stretch;
}

.user {
  margin: 5px;
}

.transition-all {
  transition-duration: .15s;
  transition-property: all;
  transition-timing-function: cubic-bezier(.4, 0, .2, 1);
}

.duration-\[0\.4s\] {
  transition-duration: .4s;
}

.dark .dark\:bg-black\/75 {
  background-color: #0c0c0dbf;
}

.backdrop-blur-lg, .backdrop-blur-md {
  -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}

.backdrop-blur-md {
  --tw-backdrop-blur: blur(12px);
}
</style>
