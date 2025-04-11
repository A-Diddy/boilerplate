const knexInstance = require("../db/knexInstance");
const logger = require("./logger.js");

/***********************************************************
 * Insert or update a record.
 *
 * Similar to the IoService.InsertUpdate() function. However, this
 * function will insert/update each table column (instead of just the
 * `json_data` property). Therefore, this function is to only be used
 * internally for system database updates. For example, roles and permissions.
 *
 * The 'data' object properties must match the database column names exactly.
 *
 * @param data: {Object} The data object to insert/update.
 * @param index {String} The table to insert/update into.
 * @returns {Promise<T>} The database update promise and results.
 ***********************************************************/
exports.insertUpdate = (data, index) => {
  return knexInstance(index)
    .where({id: data.id})
    .select("id")
    .then(async (results) => {
      logger.info("[SystemUtils] insertUpdate(", index, "): Existing records with ID: ", results);
      if (results.length >= 1) {
        console.log("UPDATE: ", data);

        return knexInstance(index)
          .returning('id')
          .where({id: data.id})
          .update(data)
          .then((result) => {
            const returnResult = {
              status: "updated",
              id: result[0].id
            }
            return returnResult
          })
          .catch((e) => {
            console.log(e);
          });
      } else {
        console.log("INSERT: ", data);
        return knexInstance(index)
          .returning('id')
          .insert(data)
          .then((result,) => {
            const returnResult = {
              status: "created",
              id: result[0].id
            }
            return returnResult
          })
          .catch((e) => {
            console.log(e);
          });
      }
    })
}

// Error handling
exports.verifyRequiredFields = (dataIn, requiredFields = []) => {
  requiredFields.forEach((field) => {
    if (!dataIn[field]) {
      const msg = `Missing required field: ${field}`;
      return {result: false, msg: msg};
    }
  });
  return {result: true, msg: "No required fields missing"};
}


/******************************************************************
 * TODO: Limit the scope of a function.
 *
 *    Call the passed in function and prevent it from accessing any
 *    variables outside its immediate/local scope.
 *
 * @param inFunc
 * @returns {*} Result of the passed in function (should be boolean)
 ******************************************************************/
exports.limitScope = (inFunc) => {


  const context = {
    // Prints something to the console, since the user-submitted
    // script has no access to the "console"-object.
    print: (arg0) => console.log(arg0),

    // Overwrite the global scope variables you want to prohibit.
    globalThis: null,
    global: null,
    window: null,
    document: null,
    fetch: null,
    console: null,
    navigator: null
  };


  const stringFunc = inFunc.toString();
  const scopeString = "const {global, globalThis} = context;"


  console.log("stringFunc = ", stringFunc);



  {
    const {global, globalThis} = context;
    return inFunc("passedParamValue");
  }



// This function wraps and encapsulates the user-submitted code
// in a class whilst also providing a custom global context/scope.
  function compileUserSubmittedMaliciousCodeToConstructor(src) {
    // Wrap the user-submitted content in a class constructor.
    src = `class UserContent { constructor() {${src.toString()}} }`;

    // Now wrap everything in our "context" object to create our
    // own "global scope".
    src = `with (context) {'use strict'; ${src};\n return UserContent;}`;

    console.log("src class = ", src);

    const fn = new Function("context", src);

    return function (context) {
      // You could optionally create a Proxy of the context object
      // here to secure things further.
      return fn.bind(null)(context);
    };
  }

  //
  // const namespace = new Proxy(
  //   {},                   // Empty means we will call the proxy for every var
  //   {                    // For each var call, handle it here...
  //     has(target, key) {
  //       // Avoid trapping global properties like `console`
  //       // if (key in globalThis) {
  //       //   return false;
  //       // }
  //       // Trap all property lookups
  //       // return true;
  //       console.log("PROXY.has(", {target, key}, ")");
  //
  //       return true;
  //     },
  //     get(target, key) {
  //       console.log("PROXY.get(", {target, key}, ")")
  //       return {};
  //     },
  //   },
  // );

  try {
    console.log("Executing function..."); // "a" "b" "c"

    // const {global} = namespace;
    //
    // console.log("global = ", global);

    // "Compile" (for the lack of a better term) the user-submitted
// content to a factory function to which we can pass our custom
// "global scope" object. Note that we're using "print()" instead
// of "console.log" in the script above.
    const func = compileUserSubmittedMaliciousCodeToConstructor(inFunc);

// userFunc will return a class declaration.
    const userFunc = func(context);

// The following will _actually_ run the user-submitted content
// in its only little tiny sandbox.
    new userFunc();
  } catch (e) {
    console.log(e);
  }
}