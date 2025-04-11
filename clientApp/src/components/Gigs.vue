<template>

  <div id="gigsActions" class="gigsActions">
    <div>
      <router-link to="/gig">
        <v-btn>
          Create New Gig
        </v-btn>
      </router-link>
    </div>
  </div>

  <div class="container_gigCards">
    <div class="container_gigCard" v-for="(gig, index) in gigData.data">
      <GigCard class="container_gigCard" :gig="gig"></GigCard>
    </div>
  </div>


  <v-table class="table_gigs">
    <DataTable
      :columns="columns"
      :data="data"
      autoWidth="false"
      :options="{ select: true }"
      ref="table"
    />
  </v-table>

  <button @click="add">Add new row</button>
  <br/>
  <button @click="update">Update selected rows</button>
  <br/>
  <button @click="remove">Delete selected rows</button>


</template>

<script setup>
import {reactive, beforeCreate, onMounted, onBeforeMount, ref} from 'vue'
import {camel2title, axios, inputFormatter} from '@/utils/utils'
import DataTable from 'datatables.net-vue3';
import {IoAPI} from "@/services/io";
import {QueryAPI} from "@/services/query";
import * as UUID from "uuid";

import GigCard from "@/components/GigCard.vue";
import CreateGig from "@/components/CreateGig.vue";


const ioService = new IoAPI(window.GLOBAL_CONFIG.config.connectionSettings).io;
const QueryService = new QueryAPI(window.GLOBAL_CONFIG.config.connectionSettings).query;

let dialog = ref(false);

const data = [
  {
    "id": UUID.v4(),
    "title": "Screenplay Writer",
    "description": "Screenplay writer needed to convert a graphic novel into a TV mini-series.",
    "salary": "$3,120",
    "start": "2023/04/25",
    "location": "Santa Monica",
    "commute": "Hybrid",
    "payType": "Hourly",
    "payRate": "500000",
    "payCurrency": "Satoshis",
    "duration": "1 month",
    "hoursPerWeek": "40",
    "keywords": ["Creative Writing", "Short Story Writing", "TV Script"],
    "expLevel": "Expert",
    "status": "OPEN",
    "created_on": "2023/01/13",
    "updated_on": "2023/01/13"
  },
  {
    "id": UUID.v4(),
    "title": "Screenplay Writer",
    "description": "Screenplay writer needed to convert a graphic novel into a TV mini-series.",
    "salary": "$3,120",
    "start": "2023/04/25",
    "location": "Santa Monica",
    "commute": "Hybrid",
    "payType": "Hourly",
    "payRate": "500000",
    "payCurrency": "Satoshis",
    "duration": "1 month",
    "hoursPerWeek": "40",
    "keywords": ["Creative Writing", "Short Story Writing", "TV Script"],
    "expLevel": "Expert",
    "status": "OPEN",       // Paused
    "positionsToFill": 1,
    "created_on": "2023/01/13",
    "updated_on": "2023/01/13"
  }
]

const getRandomTitle = () => {
  const titles = [
    "Principal Cast Member",
    "Casting Director",
    "Camera Crew Lead"
  ]
  return titles [Math.random(Date.now()).mod(titles.length - 1)];
}

const columns = [
  {data: 'title', name: "title", title: "Title"},
  {data: 'description', title: "Description"},
  {data: 'salary', title: "Pay"},
  {data: 'location', title: "Location"},
  {data: 'commute', title: "Commute Type"}
]

const options = {
  paging: false,
  ordering: false,
  info: false,
}

let userData = {};

const closeDialog = (dialog) => {
  console.log("dialog = ", dialog);
  console.log("[Gigs] closeDialog()");
  // dialog = ref(false);
  dialog = false;

  console.log("dialog = ", dialog);
}

const getUserData = async () => {
  let data = {};
  const userId = window.GLOBAL_CONFIG?.config?.user?.id || '4adb8cdf-3ad6-4da9-a0c5-922471a40224';



  if (userId) {
    // TODO: Get profile data by querying for userId.
    const query = {
      conditions: [{
        path: "userId",
        operator: "=",
        value: userId
        // value: "4adb8cdf-3ad6-4da9-a0c5-922471a40224"   // TODO: Remove this... it's just for testing
      }],
      _csrf: window.GLOBAL_CONFIG?.token
    }

    const response = await QueryService.query(query, "profiles", 0, 0);
    console.log("QueryAPI response = ", response);
    // const response = await ioService.getById("users", userId);
    // console.log("IO response = ", response);
    data = response[0]?.json_data;
  }
  console.log("Got user data: ", data);
  userData = data;
  // console.log("Setting 'dataLoaded' to true");
  // dataLoaded = ref(true);
  return data;
};

//
// onBeforeMount( () => {
//   getUserData();
// });

const getTableConfig = (tableName) => {
  console.log("getTableConfig(", tableName, ")");
  return Promise.resolve({})
}

const getGigs = async (q) => {
  console.log("getGigs(", q, ")");

  const query = {
    // conditions: [{
    //   path: "private",
    //   operator: "=",
    //   value: userId
    // }],
    _csrf: window.GLOBAL_CONFIG?.token
  }

  try {
    const response = await QueryService.query(query, "reqs", 0, 0);
    console.log("QueryAPI response = ", response);
    // const response = await ioService.getById("users", userId);
    // console.log("IO response = ", response);

    const data = [];
    response.forEach((response) => {
      data.push(response.json_data);
    })

    console.log("Got gigs: ", data);
    return data;
  } catch (e) {
    console.log(e);
  }

  return useSampleData();

}

const useSampleData = () => {
  return Promise.resolve([
    {
      "id": "44c8effa-b6a8-499d-84ce-36014aae13d4",
      "userId": "3925ab4f-0f2c-4d24-a121-daebb54a3b97",
      "gigDetails": {
        "title": "Camera Man",
        "commute": "On Site",
        "expLevel": "Expert",
        "location": "Santa Monica, CA",
        "description": "Looking for an experienced camera man for a new documentary movie.",
        "contractType": "Contract",
        "positionsToFill": "1"
      },
      "payDetails": {"payAmt": 0, "payCurrency": "$ USD"}
    },
    {
      "id": "42e8f60d-38b6-40d1-be30-51dba3a714b3",
      "userId": "3925ab4f-0f2c-4d24-a121-daebb54a3b97",
      "gigDetails": {
        "title": "Casting Director",
        "status": "Open",
        "commute": "Hybrid",
        "private": true,
        "duration": "6 Months",
        "expLevel": "Expert",
        "location": "Hollywood, CA",
        "description": "Manage cast. Including hiring, training and general oversight.",
        "contractType": "Full Time",
        "positionsToFill": "1"
      },
      "payDetails": {"payAmt": "50", "payRate": "Salary", "payCurrency": "$ USD"}
    }
  ])
}

const gigData = reactive({
  config: await getTableConfig(),
  data: await getGigs()
})

</script>

<style>
@import '../assets/styles/global.css';
@import 'datatables.net-dt';

.container_gigCards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.container_gigCard {
  margin: 20px;
  text-align: left;
}

.gigsActions {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px;
}

.table_gigs {
  width: 90vw;
  margin: 50px auto;
  padding: 20px;
}

div.dataTables_filter {
  margin: 5px;
}
</style>
