![Boilerplate deployment diagram](public/img/logo.png?raw=true "Title")

# Introduction

Boilerplate is for bootstrapping client-server applications.

## The Concept is Simple...

**Deploy Boilerplate to a server, connect a database and focus on building your client app without needing to make frequent server or database schema changes.**

## Security Included

Authentication and configurable authorization tools are built in, helping to ensure security risks are reduced by using industry standard solutions.

## Dynamic and Configurable
Dynamic APIs dramatically reduce the need to make backend server changes and nearly eliminate any database alterations.

## Agnostic Client Support
Server Side Rendering (SSR), Single Page Application (SPA) or a hybrid approach are each supported. Additionally, you can use any JS framework (such as Vue [included], or React). You can even use a non-JS framework like Android or IOS.

## Client Classes with Type Definition
Backend API services are provided as client classes with complete type definitions. This means that code help is available (if your IDE supports it) and making a call to the backend is as simple as calling one of the methods (see below). 
Additionally, since they're generated using an OpenAPI spec, they can also be generated for Android (Java) or IOS (Swift) in addition to several other languages.

````js
import {QueryAPI} from "@/services/query";
const QueryService = new QueryAPI(connectionSettings).query;

const query = {
   conditions: [{
      path: "userId",
      operator: "=",
      value: "4adb8cdf-3ad6-4da9-a0c5-922471a40224"
   }]
}

const queryResults = await QueryService.query(query, "profiles");
````

## Deployment Diagram
![Boilerplate deployment diagram](public/img/Diagram.jpg?raw=true "Title")

----
# Quick Start

0. To run this app, clone the repository and install dependencies:

```bash
$ git clone https://github.com/A-Diddy/boilerplate.git
$ cd boilerplate
$ npm install

$ cd ../clientApp
$ npm install
```
---
1. Update local environment properties:

   2. Copy and paste the `/.env` file to `/.env.local`.
   
   3. Within the `/.env.local` file, update property values under each of the following groups:
      - Environment
      - Database
      - Federated Security & OAUTH
      - Dev Config

---

2. Install and setup the database:
   
   1. Create a new database for the project. (i.e. "boilerplate").
   2. Set the user and password.
   ```sql
   create database boilerplate;
   create user boilerplate with encrypted password 'boilerplate';
   
   grant all privileges on database "boilerplate" to boilerplate;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO boilerplate;
   
   grant usage on schema public to boilerplate
   alter database boilerplate owner to boilerplate;
   ```
   
---

3. __Configure enviroment properties to point to the database:__
   
   Just as in part 1, update the `.env.local` file with the database properties created in step 2:
   ```text
   #/* * * DATABASE * * */
   DB_CONNECTION_URL=winhost
   DB_CONNECTION_USER=boilerplate
   DB_CONNECTION_PASSWORD=boilerplate
   DB_CONNECTION_DATABASE=boilerplate
   DB_CONNECTION_PORT=5432
   ```
---

4. __Run database migrations:__
   
   Once the database is running and the environment properties are configured, run the migration scripts to create the database tables.
   ```bash
   $ npm run migration:latest
   ```
   If there are any errors, verify that you can access the database with the configured properties. It could be a firewall issue on the database host machine. 
---

5. Then start the server.
   ```bash
   $ npm start
   ```
---
Navigate to [http://localhost:8080](http://localhost:8080).
(Or the `host`:`port` configured in the `.env.local` file).

# Development Overview
Boilerplate includes the following: 

- node.js Express server
- Embedded Vue.js frontend

These two are technically independent projects. However, the client app relies on the services provided by the server. The client app could be removed completely and any other client project could be used instead, as long as the production distribution package is located in `/clientApp/dist`. 

In order to deploy the full functionality, the frontend app must be built. To do this, simply use the following:
```bash
$ npm run buildClient
```

When working on both the server and the client, the following npm script is useful since it builds and deploys the client code and then starts the server.
```bash
$ npm run buildStart
```

If only working on the client app and no server changes are being made, the app can deploy in development mode, on its own, with a development node server. This has the benefit of automatic deployments when files are saved. Instead of rebuilding and deploying the entire app, only the module that's modified is rebuilt and then hot deployed (without needing to restart the dev server).
```bash
$ cd clientApp
$ npm run start
```


# Backend Services
What makes boilerplate awesome is the services it has included in it. This includes the following:

- Auth Service: Performs a full set of authentication and authorization functions.
- IO Service: Input and Output (IO) service for CRUD operations.
- Media Service: Store and retrieve binary data (such as images or movies)
- Query Service: Executes database queries using a JSON query syntax and returns paged results.

## Auth Service
Full OpenAPI specification available in `/src/services/auth/auth.yaml`. Some basic functionality includes the following:

- Signup: Creates a new user
- Login: Uses credentials to authenticate and get an active session
- Refresh Session:
- 

### Federated Security (OAuth)
Federated security using Passport is included. Below are some of the services already integrated and simply require updating the environment properties (or `.env` file) with the associated client IDs.

- Google
- Facebook
- Twitter
- LinkedIn
- Apple

### Adding OAuth Providers
Additional Passport modules can be added for new OAuth providers by simply copying the pattern used for others in `/routes/auth.js`. In a nutshell...

1. Copy an existing OAuth strategy block from `/routes/auth.js` (i.e. `passport.use(new GoogleStrategy(`).
2. Add any environment properties to the `.env` file (i.e. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
3. Be sure to handle redirects from the OAuth provider (they're all different), this is also done in `/routes/auth.js`.
4. Map any desired user properties from the OAuth provider's token to the user's account and/or profile (i.e. name, email, etc.).
5. Add the new OAuth provider to the Signup and Login views.


## IO Service
The workhorse of boilerplate and what makes it so cool. This endpoint (along with the Query Service) handles any data objects of any type. No database modifications are necessary. Want to add a field to an existing model? Then simply just update the model on the client and the IO Service will handle it. Want to add a completely new model? Then just create the model in the client app, use it and, when ready, save it. No need to add a database table or modify the database in any way. 

Instead of dealing with tables and columns and mapping back-and-forth between JSON and SQL, you now just need to worry about properly defining and using object models on the client. You were already ensuring model definitions were consistent on your app (right?) and now the extra burden of parsing to and from SQL is gone.

All data must be in proper JSON form and will be stored as JSONB so a Generalized INverted INdex (GIN) can be used. This means that it's possible to efficiently query on any values for any property in the object (see the Query Service).

The three pieces of information vital to the IO Service are as follows:
- UUID: Universally Unique ID
- Index: The model name or datatype (or table)
- Data: JSON

### UUIDs
With this power comes responsibility. It's up to the client app to create new universally unique IDs (UUIDs) (i.e. `uuid.v4()` will create a new UUID) for each record.

### Indexes
Organizing models is up to the client app and done with the 'index' property. This will allow you to query only objects of a certain type if needed. Think of the `index` as the table name in a traditional database.

### Data
The JSON data sent to the IO Service is what will be evaluated, stored, indexed and retrieved. The data is not parsed nor verified to match any defined models. Therefore, it's as fast and flexible as possible. However, you have the power to shoot your leg off. You must be ensuring the data saved is in the format expected on the client or there could be issues (i.e. undefined properties).

If you use TypeScript for both reading and writing the data, there shouldn't be any problems since it will enforce the expected model.

If not using TypeScript, you should at least be using (or considering) model classes (`class MyModel {}`).

If not using TypeScript or model class definitions (which you really should be), there will be no data enforcement provided and you'll need to rely on checking for the existence of each property before using them.


### Endpoints / Methods
- insertUpdate: Checks to see if the UUID exists and, if so, will update it. Otherwise, if the UUID does not already exist, a new record will be inserted.
- getById: Retrieves a record provided its UUID.
- deleteObject: Given an index and an ID, deletes the record.


# Client Development
Both server-side templating and single-page application (SPA) development is supported and included. Additionally, you can do both.

## Next Steps

*  [boilerplate-credential-management](https://github.com/passport/boilerplate-credential-management): [Credential Managment](https://www.w3.org/TR/credential-management-1/)
  User can store and select password

* [express-google](https://github.com/passport/todos-express-google) OAuth2
  
* [express-webauthn](https://github.com/passport/todos-express-webauthn)
  to learn how to let users sign in with biometrics or a security key.

## License


