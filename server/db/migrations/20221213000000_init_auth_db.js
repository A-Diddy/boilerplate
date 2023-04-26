const onUpdateTables = ["users", "tokens"]

exports.up = (knex) => {
  const promises = [];

  promises.push(knex.schema.raw(on_update_timestamp_function));

  // USERS Table
  promises.push(
    knex.schema.createTable("users", (table) => {
      table.uuid("id", {primaryKey: true});
      table.text("username").unique();
      table.string("email", 255).unique();
      table.binary("hashed_password");
      table.binary("salt");
      table.text("name");
      table.jsonb("json_data").notNullable();
      table.boolean("email_verified").defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(["id"]);
      table.index(["json_data"], null, "GIN");
    })
  )

  // FEDERATED_CREDENTIALS Table
  promises.push(
    knex.schema.createTable("federated_credentials", (table) => {
      table.increments("id").primary();
      table.uuid("user_id").notNullable();
      table.text("provider").notNullable();
      table.text("subject").notNullable();
      table.jsonb("json_data").notNullable();

      table.unique(["provider", "subject"]);
      table.index(["json_data"], null, "GIN");
    })
  )

  // SESSIONS Table
  promises.push(
    knex.schema.createTable("sessions", (table) => {
      table.string("sid").primary();
      table.json("sess").notNullable();
      table.timestamp('expire').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index("expire", "IDX_session_expire");
    })
  )

  // TOKENS Table
  promises.push(
    knex.schema.createTable("tokens", (table) => {
      table.increments("id").primary();
      table.text("entity");
      table.uuid("user_id").notNullable();
      table.string("token", 255);
      table.integer('expire_in');
      table.jsonb("json_data").notNullable().defaultTo({});
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(["token"]);
      table.index(["user_id"]);
      table.index(["json_data"], null, "GIN");
    })
  )

  // Create onUpdate triggers for tables
  onUpdateTables.forEach(async (tableName) => {
    promises.push(
      knex.schema.raw(getTrigger_beforeUpdate(tableName, onUpdateFunctionName))
    );
  });

  return Promise.all(promises);
}


exports.down = function (knex) {
  const promises = [];

  // Remove triggers
  onUpdateTables.forEach((tableName) => {
    promises.push(
      knex.schema.raw(
        `DROP TRIGGER IF EXISTS ${getTriggerName_beforeUpdate(
          tableName
        )} ON ${tableName};`
      )
    );
  });

  promises.push(
    knex.schema.dropTableIfExists("users")
  )
  promises.push(
    knex.schema.dropTableIfExists("federated_credentials")
  )
  promises.push(
    knex.schema.dropTableIfExists("sessions")
  )
  promises.push(
    knex.schema.dropTableIfExists("tokens")
  )

  promises.push(
    knex.schema.raw(`DROP FUNCTION IF EXISTS ${onUpdateFunctionName};`)
  );

  return Promise.all(promises);
};




/****************************************************
 * Construct a trigger name based on a table name.
 *
 * @param tableName {string}
 * @returns {`before_${string}_update_trigger`}
 ****************************************************/
const getTriggerName_beforeUpdate = (tableName) => {
  return `before_${tableName}_update_trigger`;
};

/****************************************************
 * Constructs the "before update" trigger syntax.
 *
 * @param tableName {string}: The table to link the trigger to.
 * @param funcName {string}: The function to call with the trigger.
 * @returns {string}: The trigger syntax
 ****************************************************/
const getTrigger_beforeUpdate = (tableName, funcName) => {
  return `CREATE TRIGGER  ${getTriggerName_beforeUpdate(tableName)}
        BEFORE UPDATE ON ${tableName}
        FOR EACH ROW
        EXECUTE PROCEDURE ${funcName}();`;
};

// The name of the shared function to call with each trigger
const onUpdateFunctionName = "on_update_timestamp_function";

// The timestamp update function definition
const on_update_timestamp_function = `
    CREATE OR REPLACE FUNCTION ${onUpdateFunctionName}()
    RETURNS TRIGGER
        LANGUAGE PLPGSQL
        AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$;
`;
