var Twitter = require('twitter');
var config = require('./config.js');
// const express = require("express");
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const SceneModel = require('./models/Scene').SceneModel;
const twitterMedia = require('./twitter_media');

const T = new Twitter(config);
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

// setInterval( () => {
//   getRandomScene().then( (scene) => {
//     console.log(scene);
//   });
// }, 5 * 1000)

getRandomScene().then( (scene) => {
  var image = scene.scenes[0];
  // console.log(image);
  var mediaData = image.data
  let buff = Buffer.from(image.data, 'base64');
  var mediaType = image.contentType
  var mediaSize = buff.byteLength;
  console.log('Got the image data');
  // console.log(mediaData);
  
  console.log(mediaType);
  console.log(mediaSize);
  postTweetWithImage(mediaType, mediaData, mediaSize)
})

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

// var image = fs.readFileSync('test.jpg');
// // postTweetWithImage(image);
// console.log(image);
const image = 'test.jpg';
const mediaType   = 'image/jpg'; // `'video/mp4'` is also supported
const mediaData   = require('fs').readFileSync(image).toString('base64');
const mediaSize    = require('fs').statSync(image).size;

// postTweetWithImage(mediaType, mediaData, mediaSize);

function postTweetWithImage(mediaType, mediaData, mediaSize) {
  twitterMedia.initUpload(mediaSize, mediaType) // Declare that you wish to upload some media
  .then( (mediaId) => twitterMedia.appendUpload(mediaId, mediaData)) // Send the data for the media
  .then(twitterMedia.finalizeUpload) // Declare that you are done uploading chunks
  .then(mediaId => {
    // You now have an uploaded movie/animated gif
    // that you can reference in Tweets, e.g. `update/statuses`
    // will take a `mediaIds` param.
    // Lets tweet it
    var status = {
      status: 'I am a tweet',
      media_ids: mediaId // Pass the media id string
    }

    T.post('statuses/update', status, function(error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
    });
  });
}
