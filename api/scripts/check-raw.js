const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query('SELECT id, name, domain, \"profileUrl\" FROM \"Business\"'))
  .then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
  })
  .catch(err => {
    console.error(err);
  })
  .finally(() => client.end());
