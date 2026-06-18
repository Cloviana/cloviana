const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query('SELECT id, name, domain, \"profileUrl\" FROM \"businesses\"'))
  .then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
  })
  .catch(err => {
    console.error(err);
  })
  .finally(() => client.end());
