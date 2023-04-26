const config = require("./dbConfig");
const knex = require("knex");
module.exports = knex(config);

