var Twitter = require('twitter');
var config = require('./config.js');
const express = require("express");
const app = express();


const port = 3000;
var T = new Twitter(config);

app.get('/',
  function(req, res) {
    res.send('Hello World');
  });

  app.listen(port, () => console.log(`Server is running on port ${port}!`));
