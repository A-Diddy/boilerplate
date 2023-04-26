import { createApp } from 'vue';
import App from './App.vue';
import router from './router'
import store from './store'

// TODO: Configure the offline caching to work with CSRF tokens before turning this on.
//  Alternatively, redirect with a fresh token whenever an old token from cache is used.
// import './registerServiceWorker'

// Primefaces
import PrimeVue from 'primevue/config';
import Ripple from 'primevue/ripple';
import 'primevue/resources/themes/mdc-dark-indigo/theme.css';


// Formkit -------------------------------------
import { plugin, defaultConfig } from '@formkit/vue';

// Formkit pro
const lic = process.env.VUE_APP_FORMKITPRO_LIC || "";
import { createProPlugin, inputs } from '@formkit/pro';
// const pro = createProPlugin('fk-47b10729bf8', inputs);
const pro = createProPlugin(lic, inputs);

// Formkit themes
import '@formkit/themes/genesis';
import '@formkit/pro/genesis'

// Formkit pro configuration
const formKitProConfig = defaultConfig(
  {
    plugins: [pro],
    config: {
      classes: {
        form: 'custom'          // Add custom CSS class to each Formkit <form> element
      }
    }
  }
)
// ---------------------------------------------

// DataTables
import DataTable from 'datatables.net-vue3'
import DataTablesLib from 'datatables.net';
DataTable.use(DataTablesLib);


// Vuetify
import 'vuetify/styles'
import { createVuetify, ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const Dark: ThemeDefinition = {
  dark: true,
  // colors: {
  //   background: '#FFFFFF',
  //   surface: '#FFFFFF',
  //   primary: '#FD5A1E',
  //   'primary-darken-1': '#3700B3',
  //   secondary: '#03DAC6',
  //   'secondary-darken-1': '#018786',
  //   error: '#B00020',
  //   info: '#2196F3',
  //   success: '#4CAF50',
  //   warning: '#FB8C00',
  // }
}

const Light: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#FD5A1E',
    'primary-darken-1': '#3700B3',
    secondary: '#03DAC6',
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
  }
}

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'Dark',
    // defaultTheme: 'Light',
    themes: {
      Dark,
      Light
    }
  }
})

const app = createApp(App)
  .use(store)
  .use(router)
  // .use(plugin, defaultConfig)   // FormKit (non-pro)
  .use(plugin, formKitProConfig) // FormKit Pro
  .use(PrimeVue)
  // .use(PrimeVue, {ripple: true})
  // .directive('ripple', Ripple)
  .use(vuetify)
  .mount('#app');
