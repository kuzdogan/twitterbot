var Twitter = require('twitter');
var config = require('./config.js');
// const express = require("express");
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const T = new Twitter(config);
const SceneModel = require('./models/Scene').SceneModel;

const DB_NAME = 'test';
const IMAGE_PATH = path.join(__dirname, 'assets', 'images');
const DB_URL = 'mongodb://localhost/' + DB_NAME;


// Connect to db
mongoose.connect(DB_URL, {useNewUrlParser: true, connectTimeoutMS: 5000});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected!")
  // we're connected!
});

setInterval( () => {
  getRandomScene().then( (scene) => {
    console.log(scene);
  });
}, 5 * 1000)


/**
 * @function to get a random scene
 * @returns {Promise} with the Scene found
 */
function getRandomScene() {
  return SceneModel.countDocuments().then( (count) => {
    // Get a random entry
    var random = Math.floor(Math.random() * count)
    console.log('Random: ' + random);
    return SceneModel.findOne({posted: false}).skip(random);
  });
}


// Make post request on media endpoint. Pass file data as media parameter
// T.post('media/upload', {media: image}, function(error, media, response) {

//   if (!error) {

//     // If successful, a media object will be returned.
//     console.log(media);

//     // Lets tweet it
//     var status = {
//       status: 'I am a tweet',
//       media_ids: media.media_id_string // Pass the media id string
//     }

//     T.post('statuses/update', status, function(error, tweet, response) {
//       if (!error) {
//         console.log(tweet);
//       }
//     });

//   }
// });