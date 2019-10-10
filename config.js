// config.js
const dotenv = require('dotenv');
let result = dotenv.config();
if (result.error) {
  throw result.error
}
// Get environment vars and write into a config.js
module.exports = {
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  db_password: process.env.DB_PASSWORD,
  db_user: process.env.DB_USER,
  db_name: process.env.DB_NAME,
  db_url: process.env.DB_URL,
};