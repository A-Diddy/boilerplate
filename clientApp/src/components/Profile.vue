<template>
  <h1>Profile</h1>
  <FormKitSchema :schema="schema" :data="data"/>
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

let {steps, visitedSteps, activeStep, setStep, stepPlugin} = useSteps()
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

//
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

const data = reactive({
  // userData: getUserData(),
  userData: await getUserData(),
  // firstName: getFirstName(userData),
  // lastName: getLastName(userData),
  // name: userData.name,
  firstName: "",
  lastName: "",
  name: "",
  steps,
  visitedSteps,
  activeStep,
  plugins: [
    stepPlugin
  ],
  getFirstName: getFirstName,
  getLastName: getLastName,

  inputFormatter: target => {
    // inputFormatter(target);
  },
  setStep: target => () => {
    setStep(target)
  },
  setActiveStep: stepName => () => {
    data.activeStep = stepName
  },
  showStepErrors: stepName => {
    return (steps[stepName].errorCount > 0 || steps[stepName].blockingCount > 0) && (visitedSteps.value && visitedSteps.value.includes(stepName))
  },
  stepIsValid: stepName => {
    return steps[stepName].valid && steps[stepName].errorCount === 0
  },
  submit: async (formData, node) => {
    console.log("submit: ", {formData, node, userData});

    try {
      formData["_csrf"] = window.GLOBAL_CONFIG?.token; // Get CSRF Token
      formData.id = formData.id || userData?.id || UUID();
      formData.userId = window.GLOBAL_CONFIG?.config?.user?.id;
      console.log(formData);
      const res = await ioService.insertUpdate(formData, "profiles");
      console.log(res);

      // const res = await axios.post(formData)
      node.clearErrors()
      // alert('Your application was submitted successfully!')
    } catch (err) {
      console.log(err);
      node.setErrors(err.formErrors, err.fieldErrors)
    }
  },
  stringify: (value) => JSON.stringify(value, null, 2),
  camel2title
})

const schema = [
  {
    $cmp: 'FormKit',
    props: {
      type: 'form',
      id: 'form',
      onSubmit: '$submit',
      plugins: '$plugins',
      actions: false,
    },
    children: [
      {
        $el: 'ul',
        attrs: {
          class: "steps"
        },
        children: [
          {
            $el: 'li',
            for: ['step', 'stepName', '$steps'],
            attrs: {
              class: {
                'step': true,
                'has-errors': '$showStepErrors($stepName)'
              },
              onClick: '$setActiveStep($stepName)',
              'data-step-active': '$activeStep === $stepName',
              'data-step-valid': '$stepIsValid($stepName)'
            },
            children: [
              {
                $el: 'span',
                if: '$showStepErrors($stepName)',
                attrs: {
                  class: 'step--errors'
                },
                children: '$step.errorCount + $step.blockingCount'
              },
              '$camel2title($stepName)'
            ]
          }
        ]
      }, {
        $el: 'div',
        attrs: {
          class: 'form-body'
        },
        children: [
          {
            $el: 'section',
            attrs: {
              class: 'formGroup',
              style: {
                if: '$activeStep !== "contactInfo"',
                then: 'display: none;'
              }
            },
            children: [{
              name: 'id',
              type: "hidden",
              value: "$userData.id"
              // validation: 'required'
            }, {
              $formkit: 'group',
              id: 'contactInfo',
              name: 'contactInfo',
              children: [
                {
                  $el: 'section',
                  attrs: {
                    class: 'subSection',
                  },
                  children: [{
                    $formkit: 'text',
                    name: 'firstName',
                    label: '*First Name',
                    placeholder: 'Firstname',
                    children: "Austin",
                    value: "$userData.contactInfo.firstName"
                    // validation: 'required'
                  },
                    {
                      $formkit: 'text',
                      name: 'lastName',
                      label: '*Last Name',
                      placeholder: 'Lastname',
                      value: '$userData.contactInfo.lastName'
                      // validation: 'required'
                    },
                    {
                      $formkit: 'email',
                      name: 'email',
                      label: '*Email address',
                      placeholder: 'email@domain.com',
                      value: '$userData.contactInfo.email'
                      // validation: 'required|email',
                      // validation: 'email'
                    },
                    {
                      $formkit: 'mask',
                      name: 'tel',
                      label: '*Telephone',
                      mask: '+1 (###) ###-####',
                      unmaskValue: true,
                      showMask: true,
                      value: '$userData.contactInfo.tel'
                      // validation: 'matches:/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/'
                    }]
                },
                // {
                //   $formkit: 'tel',
                //   name: 'tel2',
                //   label: '*Telephone2',
                //   // placeholder: 'xxx-xxx-xxxx',
                //   placeholder: '+1 (___) ___-____',
                //   onChange: '$inputFormatter',
                //   "data-slots": '_',
                //   help: 'Phone number must be in the xxx-xxx-xxxx format.'
                //   ,
                //   validation: 'required|matches:/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/'
                // }
              ]
            }
            ]
          },
          {
            $el: 'section',
            attrs: {
              class: 'formGroup',
              style: {
                if: '$activeStep !== "personalInfo"',
                then: 'display: none;'
              }
            },
            children: [{
              $formkit: 'group',
              id: 'personalInfo',
              name: 'personalInfo',
              children: [{
                $el: 'section',
                attrs: {
                  class: 'subSection',
                },
                children: [{
                  $formkit: 'date',
                  label: '*Birth Date',
                  name: 'dob',
                  validation: 'required',
                  value: '$userData.personalInfo.dob'
                }, {
                  $formkit: 'text',
                  label: '*SSN/Tax ID (Last Four)',
                  name: 'tax_id',
                  placeholder: '####',
                  help: 'Enter the last 4 digits of your SSN (Tax ID)',
                  value: '$userData.personalInfo.tax_id',
                  validation: 'required|number|length:4,4'
                }]
              }]
            }]
          },
          {
            $el: 'section',
            attrs: {
              class: 'formGroup',
              style: {
                if: '$activeStep !== "termsAndConditions"',
                then: 'display: none;'
              }
            },
            children: [{
                $formkit: 'group',
                id: 'termsAndConditions',
                name: 'termsAndConditions',
                children: [{
                  $el: 'section',
                  attrs: {
                    class: 'subSection',
                  },
                  children: [{
                    $formkit: 'checkbox',
                    label: '*I agree to the terms and conditions',
                    help: '',
                    name: 'agreeTerms',
                    validation: 'required|accepted',
                    value: '$userData.termsAndConditions.agreeTerms',
                    validationMessages: {
                      accepted: 'You must agree to the terms and conditions'
                    }
                  }]
                }]
              }]
          }, {
            $el: 'div',
            attrs: {
              class: 'step-nav'
            },
            children: [
              {
                $formkit: 'button',
                style: {
                  if: '$activeStep === "contactInfo"',
                  then: 'display: none;'
                },
                onClick: '$setStep(-1)',
                children: 'Previous Step'
              },
              {
                $formkit: 'button',
                style: {
                  if: '$activeStep === "termsAndConditions"',
                  then: 'display: none;'
                },
                onClick: '$setStep(1)',
                children: 'Next Step'
              }
            ]
          }, {
            $el: 'details',
            children: [
              {
                $el: 'summary',
                children: 'Form data'
              },
              {
                $el: 'pre',
                children: '$stringify( $get(form).value )'
              }
            ]
          },
        ]
      },
      {
        $formkit: 'submit',
        label: 'Save Profile',
        disabled: '$get(form).state.valid !== true'
      }
    ]
  },
  {
    $el: 'p',
    children: [
      {
        $el: 'small',
        children: [
          {
            $el: 'em',
            children: ''
          }
        ]
      }
    ]
  }
]
</script>

<style>
@import '../assets/styles/formkitDefault.css';
</style>
