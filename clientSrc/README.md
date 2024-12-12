# Boilerplate Client App

## Project setup
```
npm install
```

### Create a `env.local` file
1. Copy the `.env` file in the root directory, calling it `.env.local'.
2. Add the Formkit Pro dev license to the following line:
```
# Formkit pro license string
VUE_APP_FORMKITPRO_LIC=
```
*Note: See Austin for a dev license.*

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your unit tests
```
npm run test:unit
```

### Run your end-to-end tests
```
npm run test:e2e
```

### Lints and fixes files
```
npm run lint
```

### Builds models from OpenAPI specs
```
npm run lint
```

### Customize configuration
See [VUE Configuration Reference](https://cli.vuejs.org/config/).

----
## Development Tips

### OpenAPI Specifications: Integration with the backend API
The OpenAPI specifications provided by each backend API service are defined in YAML files within their respective folders under `/clientSrc/src/services/` (i.e. [clientSrc/src/services/io/io.yaml](src/services/io/io.yaml)).

The YAML files are used to auto-generate client-side TypeScript classes which provide everything needed to interface with the backend:
* Documentation
* Fetch requests as functions
* Model definitions
* Enumerated values and other options

_**NOTE:**_
We are currently generating TypeScript classes due to the enhanced readability of generated code and to provide advanced code help in your IDE.
Type-safety is not enforced (by policy), but is available if desired.


### Re-generate client services when OpenAPI specs are updated

_**NOTE:**_
*This step is (typically) only needed when the OpenAPI YAML files change and the client services need to be recreated (i.e. using a new version of the API).*

_**NOTE:**_
*This step is automatically executed when running `npm install` (during the `postinstall` execution). However, sometimes it's convenient to just rebuild the client services instead of the entire project. In which case, use the below steps.*

The latest backend specification should be committed within this project (under [src/services](src/services/))... so expect the latest updates to be official.
If the YAML files are updated, the following steps can be taken to auto-generate the updated client-side code without needing to rebuild the entire client project:

1. Ensure the OpenAPI YAML files are up-to-date (i.e. `git pull`).

2. Run the `buildClients` NPM script to auto-generate new client-side service classes based on the updated OpenAPI YAML files:

   `npm run buildClients`

   _**NOTE:**_
   *Alternatively, you could build the entire project (`npm i`) and the client service code will be re-generated.*


The new classes (models and services) will be generated into their respective directories under `/clientSrc/src/services/`.

The new files should be hot-deployed if the dev server is already running. However, if the changes aren't picked up, simply restart the server.


**IMPORTANT:** If there are updates that modify the API (frontend or backend), those changes must be reflected in the OpenAPI specifications within the YAML files and committed with the project/branch. Downstream build processes will need them since the
auto-generated interface classes are _NOT_ committed.
