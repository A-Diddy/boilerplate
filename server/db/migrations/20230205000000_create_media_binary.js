const tables = ["media_binary"];

exports.up = (knex) => {
  const promises = [];
  promises.push(knex.schema.raw(on_update_timestamp_function));
  tables.forEach(async (tableName) => {
    promises.push(
      knex.schema.createTable(tableName, (table) => {
        table.uuid("id", {primaryKey: true});
        table.text("og_filename");
        table.text("media_type");
        table.text("encoding");
        table.integer("size");
        table.timestamp('last_modified');
        table.boolean("use_hash").defaultTo(true);
        table.jsonb("json_data").notNullable().defaultTo({});
        table.binary("binary_data").notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      })
    )

    promises.push(
      knex.schema.raw(getTrigger_beforeUpdate(tableName, onUpdateFunctionName))
    );
  });

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