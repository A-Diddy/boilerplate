// const tables = ["profiles", "orgs", "media", "events", "actions", "config", "io", "reqs", "assignments", "gigs", "applications", "approvals", "worklogs", "timesheets", "invoices", "workflows"];

const tables = ["profiles", "orgs", "media", "events", "actions", "config", "io"];

// const MEDIA_BINARY_TABLE = "media_binary"

exports.up = (knex) => {
  const promises = [];
  promises.push(knex.schema.raw(on_update_timestamp_function));
  tables.forEach(async (tableName) => {
    promises.push(
      knex.schema.createTable(tableName, (table) => {
        table.uuid("id", {primaryKey: true});
        table.text("index");
        table.jsonb("json_data").notNullable().defaultTo({});
        table.text("created_by");                 // User
        table.text("owned_by");                   // User, role, group, etc.
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.index(["id"]);
        table.index(["id", "index"]);
        table.index(["json_data"], null, "GIN");
      })
    )

    promises.push(
      knex.schema.raw(getTrigger_beforeUpdate(tableName, onUpdateFunctionName))
    );
  });

  // MEDIA_BINARY
  //
  // promises.push(
  //   knex.schema.createTable(MEDIA_BINARY_TABLE, (table) => {
  //     table.uuid("id", {primaryKey: true});
  //     table.text("og_filename");
  //     table.text("media_type");
  //     table.text("encoding");
  //     table.text("size");
  //     table.jsonb("json_data").notNullable().defaultTo({});
  //     table.binary("binary_data").notNullable();
  //     table.text("created_by");                 // User
  //     table.text("owned_by");                   // User, role, group, etc.
  //     table.timestamp('created_at').defaultTo(knex.fn.now());
  //     table.timestamp('updated_at').defaultTo(knex.fn.now());
  //   })
  // )

  // promises.push(
  //   knex.schema.raw(getTrigger_beforeUpdate(MEDIA_BINARY_TABLE, onUpdateFunctionName))
  // );

  return Promise.all(promises);
}

exports.down = function (knex) {
  const promises = [];
  tables.forEach((tableName) => {
    promises.push(
      knex.schema.raw(
        `DROP TRIGGER IF EXISTS ${getTriggerName_beforeUpdate(
          tableName
        )} ON ${tableName};`
      )
    );

    promises.push(
      knex.schema.dropTableIfExists(tableName)
    )
  });

  // MEDIA_BINARY

  // promises.push(
  //   knex.schema.raw(
  //     `DROP TRIGGER IF EXISTS ${getTriggerName_beforeUpdate(
  //       MEDIA_BINARY_TABLE
  //     )} ON ${MEDIA_BINARY_TABLE};`
  //   )
  // );
  //
  // promises.push(
  //   knex.schema.dropTableIfExists(MEDIA_BINARY_TABLE)
  // );


  // This moved to init_auth_db.js
  // promises.push(
  //   knex.schema.raw(`DROP FUNCTION IF EXISTS ${onUpdateFunctionName};`)
  // );

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