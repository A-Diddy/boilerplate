<template>
<!--  <FormKitSchema :schema="schema" :data="data"/>-->


  <DynamicForm :schema="formSchema" />




  <div id="form_profileContainer" class="form_profileContainer">
  <form @submit.prevent="submit">
    <v-text-field
      v-model="name.value.value"
      :counter="10"
      :error-messages="name.errorMessage.value"
      label="Name"
    ></v-text-field>

    <v-text-field
      v-model="phone.value.value"
      :counter="7"
      :error-messages="phone.errorMessage.value"
      label="Phone Number"
    ></v-text-field>

    <v-text-field
      v-model="email.value.value"
      :error-messages="email.errorMessage.value"
      label="E-mail"
    ></v-text-field>

    <v-select
      v-model="select.value.value"
      :error-messages="select.errorMessage.value"
      :items="items"
      label="Select"
    ></v-select>

    <v-checkbox
      v-model="checkbox.value.value"
      :error-messages="checkbox.errorMessage.value"
      label="Option"
      type="checkbox"
      value="1"
    ></v-checkbox>

    <v-btn
      class="me-4"
      type="submit"
    >
      submit
    </v-btn>

    <v-btn @click="handleReset">
      clear
    </v-btn>
  </form>
  </div>
</template>

<script setup>
import {reactive} from 'vue'
import {camel2title} from '@/utils/utils'
import useSteps from '../utils/useSteps.js'
import {v4 as UUID} from "uuid";
import {IoAPI} from "@/services/io";
import {QueryAPI} from "@/services/query";

const ioService = new IoAPI(window.GLOBAL_CONFIG.config.connectionSettings).io;
const QueryService = new QueryAPI(window.GLOBAL_CONFIG.config.connectionSettings).query;

import { ref } from 'vue'
import { useField, useForm } from 'vee-validate'

const { handleSubmit, handleReset } = useForm({
  validationSchema: {
    name (value) {
      if (value?.length >= 2) return true

      return 'Name needs to be at least 2 characters.'
    },
    phone (value) {
      if (/^[0-9-]{7,}$/.test(value)) return true

      return 'Phone number needs to be at least 7 digits.'
    },
    email (value) {
      if (/^[a-z.-]+@[a-z.-]+\.[a-z]+$/i.test(value)) return true

      return 'Must be a valid e-mail.'
    },
    select (value) {
      if (value) return true

      return 'Select an item.'
    },
    checkbox (value) {
      if (value === '1') return true

      return 'Must be checked.'
    },
  },
})
const name = useField('name')
const phone = useField('phone')
const email = useField('email')
const select = useField('select')
const checkbox = useField('checkbox')

const items = ref([
  'Item 1',
  'Item 2',
  'Item 3',
  'Item 4',
])

const submit = handleSubmit(values => {
  alert(JSON.stringify(values, null, 2))
})






import DynamicForm from '@/components/DynamicForm.vue';
import * as Yup from 'yup';

const formSchema = {
  fields: [
    {
      label: 'Your Name',
      name: 'name',
      as: 'input',
      rules: Yup.string().required(),
    },
    {
      label: 'Your Email',
      name: 'email',
      as: 'input',
      rules: Yup.string().email().required(),
    },
    {
      label: 'Your Password',
      name: 'password',
      as: 'input',
      type: 'password',
      rules: Yup.string().min(6).required(),
    },
  ],
};







let userData = {};

const getUserData = async () => {
  let data = {};
  const userId = window.GLOBAL_CONFIG?.config?.user?.id || '4adb8cdf-3ad6-4da9-a0c5-922471a40224';

  if (userId) {
    // Get profile data by querying for userId.
    const query = {
      conditions: [{
        path: "userId",
        operator: "=",
        value: userId
      }]
    }


    const response = await QueryService.query(query, "profiles", 0, 0);
    console.log("QueryAPI response = ", response);
    data = response[0]?.json_data;
  }
  console.log("Got user data: ", data);
  userData = data;
  // console.log("Setting 'dataLoaded' to true");
  // dataLoaded = ref(true);
  return data;
};


// onBeforeMount( () => {
//   getUserData();
// });

const getFirstName = (data = data?.userData) => {
  data = data?.contactInfo || data || {};
  return data?.name?.split(" ")[0];
}

const getLastName = (data) => {
  return data?.name?.split(" ")[data?.name?.split(" ").length - 1];
}

</script>

<style>
@import '../assets/styles/formkitDefault.css';

.form_profileContainer {
  max-width: 600px;
  margin: 20px auto;
}

.form_profileContainer form {

}
</style>
