// config.js
const dotenv = require('dotenv');
dotenv.config();
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

module.exports = {
    consumer_key: 'z1Hb1Sm7ld03NT4RwgeExjFfZ',
    consumer_secret: 'jEkOGc5aboXpCYCfmYsfIUNLM28KuYM31zU0szscGgweb9ZUA7',
    access_token_key: '1036541782631301121-RdcKSduvvvVqz1uQYqdKMuuBdrv6LN',
    access_token_secret: 'sml0Px9nvBTjEIImEi1mAR7hHE1dq6GoYBuI7FRKOJbk1',
    db_password: 'vZAxMxQ8x6T7zh',
    db_user: 'kuzdogan',
    db_name: 'sifirbir',
    db_url: 'cluster0-2is6r.mongodb.net/'
  }
  