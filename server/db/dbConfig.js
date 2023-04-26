const dotenv = require("dotenv");
dotenv.config({ path: "../../.env" });

module.exports = {
  client: process.env.DB_CONNECTION_CLIENT,
  connection: {
    host: process.env.DB_CONNECTION_URL,
    port: process.env.DB_CONNECTION_PORT,
    user: process.env.DB_CONNECTION_USER,
    password: process.env.DB_CONNECTION_PASSWORD,
    database: process.env.DB_CONNECTION_DATABASE,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: __dirname + "/migrations",
    tableName: "knex_migrations",
  },
  seeds: {
    directory: __dirname + "/seeds",
  },
};
