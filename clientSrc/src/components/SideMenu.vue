<template>
  <v-card :theme="darkMode ? 'dark' : 'light'">
    <v-layout>

      <v-navigation-drawer
        v-if="navView"
        v-model="drawer"
        :rail="rail"
        class="mainMenu"
        :rail-width="railWidth"
        permanent
        @click="rail = !!lockRail"
      >

        <!-- Nav header -->
        <v-list-item
          class="navHeader"
          prepend="profilePrepend"
          nav>
          <!-- Rail prepend icon template -->
          <template v-slot:prepend="profilePrepend">
            <span class="menuPrepend menuPrepend_logo">
                RTI
            </span>
          </template>

          <!-- Close arrow -->
          <template v-slot:append>
            <v-btn
              class="closeArrow"
              variant="text"
              icon="mdi-chevron-left"
              @click.stop="rail = !rail"
            ></v-btn>
          </template>
        </v-list-item>

        <!-- Main menu -->
        <v-list
          density="compact"
          tag="mainmenu"
          class="mainMenu-items"
          nav>
          <span
            v-for="(mi, i) in menus.main"
            :key="i"
            :title="mi.title">
            <v-list-item
              prepend="mainTitle"
              :disabled="mi.disabled"
              density="comfortable"
              :tag="mi.id"
              value="account"
              @click.stop="this.$router.push(mi.to)">

              <!-- Rail prepend icon template -->
              <template v-slot:prepend="mainTitle">
                <span class="menuPrepend">
                  <v-badge v-if="mi.badge" :content="mi.badge?.content" :color="mi.badge?.type" dot>
                    <v-icon :icon="mi.icon" :size="iconSize"></v-icon>
                  </v-badge>
                  <v-icon v-else :icon="mi.icon" :size="iconSize"></v-icon>
                  <div class="menuPrepend-title">{{ mi.title }}</div>
                </span>
              </template>

              <!-- Submenus -->
              <v-menu transition="slide-x-transition" location="end">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" style="width:100%;">
                    {{ mi.title }}
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item
                    v-for="(item, i) in menus[mi.id]"
                    :key="i"
                    :to="item.to"
                  >
                    <v-list-item-title>
                      <v-icon :icon="item.icon"></v-icon>
                      {{ item.title }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-list-item>
            </span>
        </v-list>

        <!-- Profile -->
        <v-list-item
          class="container_profile"
          prepend="profilePrepend"
          nav>

          <!-- Rail prepend icon template -->
          <template v-slot:prepend="profilePrepend">
            <span class="menuPrepend">

              <!-- Profile card -->
              <v-list-item-title>
                <div class="text-center">
                  <v-menu
                    v-model="menu"
                    :close-on-content-click="false"
                    location="end"
                  >
                    <template v-slot:activator="{ props }">
                      <div id="container_username" class="container_username" v-bind="props">
                        <v-avatar>
                          <img src="/img/sampleProfilePic2.png"  class="profile_img"/>
                        </v-avatar>
                      </div>
                    </template>
                    <v-card min-width="300">
                      <v-list>
                        <v-list-item
                          style=""
                          class="profile_item"
                          prepend-avatar="/img/sampleProfilePic2.png"
                          :title="username"
                          subtitle="Boilerplate"
                        >
                        </v-list-item>
                      </v-list>
                      <v-divider></v-divider>
                      <v-list>
                        <v-list-item>
                          <v-switch
                            v-model="darkMode"
                            label="Dark Mode"
                            hide-details
                            @click="onDarkModeClicked"
                          ></v-switch>
                        </v-list-item>
                        <v-list-item
                          title="Sign out"
                          to="logout">
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-menu>
                </div>
              </v-list-item-title>

            </span>
          </template>


          <!-- Close arrow -->
          <template v-slot:append>
            <!--            <v-btn
                          class="closeArrow"
                          variant="text"
                          icon="mdi-chevron-left"
                          @click.stop="rail = !rail"
                        ></v-btn>-->
          </template>
        </v-list-item>

      </v-navigation-drawer>

      <!-- Content -->
      <v-main class="container_main" style="height: 100vh">
        <slot></slot>
      </v-main>
    </v-layout>
  </v-card>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
// @ts-ignore
import {hasPriv} from "@/utils/appUtils.js";

const sampleBadge = {
  type: "warning",
  content: "2"
}

export default defineComponent({
  name: 'SideMenu',
  components: {},
  props: {
    msg: String
  },
  data() {
    return {
      navView: this.$route.meta.navBar || false,
      railWidth: 65,
      iconSize: "default",
      lockRail: true,
      darkMode: false,
      fav: true,
      menu: null,
      message: false,
      hints: true,
      theme: "light",
      drawer: null,
      menus: {
        "main": [
          {
            id: "task",
            title: 'Tasks',
            icon: 'mdi-clipboard-check-outline',
            to: "/",
            disabled: false,
            badge: sampleBadge
          },
          {id: "gig", title: 'Requisitions', icon: 'mdi-account-box-outline', to: "/gigs"},
          {id: "ass", title: 'Assignments', icon: 'mdi-account-hard-hat-outline', to: "/assignments", disabled: true},
          {id: "worker", title: 'Workers', icon: 'mdi-account-multiple-outline', to: "/workers", disabled: true},
        ],
        "task": [
          {title: 'Create', icon: 'mdi-plus', to: "/task"},
          {title: 'Manage', icon: 'mdi-folder', to: "/tasks"}
        ],
        "gig": [
          {title: 'Create', icon: 'mdi-plus', to: "/gig"},
          {title: 'Manage', icon: 'mdi-folder', to: "/gigs"}
        ],
        "ass": [
          {title: 'Create', icon: 'mdi-plus', to: "/assignment"},
          {title: 'Manage', icon: 'mdi-folder', to: "/assignments"}
        ],
        "worker": [
          {title: 'Create', icon: 'mdi-plus', to: "/worker"},
          {title: 'Manage', icon: 'mdi-folder', to: "/workers"}
        ]
      },
      rail: true,
      hasPriv: hasPriv,
      username: window["GLOBAL_CONFIG"]?.config?.user?.name
    }
  },
  watch: {
    '$route'(to, from) {
      this.navView = to.meta.navBar || false;
    }
  },
  mounted() {
    this.darkMode = JSON.parse(localStorage.getItem("darkMode") || "false") || false;
    this.onResize();
    window.addEventListener('resize', this.onResize, true);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.onModeChange, true);
  },
  methods: {
    onModeChange(e: any) {
      this.darkMode = !!e.matches;
      saveMode(this.darkMode);
    },
    onResize() {
      if (window.innerWidth >= 899) {
        this.railWidth = 90;
        this.iconSize = "x-large";
      } else {
        this.railWidth = 65;
        this.iconSize = "default";
      }
    },
    onDarkModeClicked() {
      setTimeout(() => {
        saveMode(this.darkMode);
      }, 0);
    }
  }
})

const saveMode = (darkMode: any) => {
  localStorage.setItem("darkMode", darkMode);
}
</script>

<style scoped>
.gigsActions {
  margin: 20px auto;
  max-width: 200px;
}

.title {
  margin: 30px auto;
}

.logout a {
  color: #000000;
  font-size: small;
}

.subheading h1, h1 {
  /*color: #000000;*/
}

a.menu-link {
  color: black;
}

/*************************************
 * Menu
 *************************************/
.mainMenu {
  transition: width .5s;
}

.v-list-item__overlay {
  border-radius: 0;
}

.menuPrepend img {
  max-width: 42px;
}

.menuPrepend {
  text-align: center;
  min-width: 50px;
  margin-right: 20px;
  transition: min-width 1s;
}

.menuPrepend_logo {
  font-size: 24px;
  font-weight: bolder;
}

/*.menuPrepend-title {*/
/*}*/

.menuPrepend-title {
  font-size: 0;
  transition: font-size 1s;
}

.closeArrow {
  margin-left: 10px;
}

.mainMenu-items span {
  transition: padding-top 1s;
}

.container_profile {
  position: absolute;
  bottom: 0;
}

.container_username {
  margin-bottom: 10px;
}

.profile_item {
  /*background: url('/img/sampleBannerPic.png'); background-size:cover;*/
}

.profile_img {
  filter: grayscale(1)
}

.profile_img:hover {
  filter: none;
}

/*************************************
 * Content (Main)
 *************************************/
.container_main {
  overflow: scroll;
}

/*************************************
 * Desktop classes
 *************************************/
@media (min-width: 899px) {
  .menuPrepend {
    min-width: 75px;
    font-size: larger;
  }

  .menuPrepend_logo {
    font-size: 24px;
  }

  .menuPrepend-title {
    font-size: small;
  }

  .mainMenu-items span {
    padding-top: 10px;
    padding-bottom: 10px;
  }
}
</style>
