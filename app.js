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

//   getRandomScene().then( (scene) => {
//     console.log(scene);
//   });
// setInterval( () => {
  getRandomScene().then( (scene) => {
    // var image = scene.scenes[0];
    let length = scene.scenes.length;
    console.log('Scene length is: ' + length);
    if (length == 1) {
      postSceneWithSingleMedia(scene);
    } else {
      postSceneWithMultipleImages(scene);
    }
  })
// }, 5 * 1000)

/**
 * @function to get a random scene
 * @returns {Promise} with the Scene found
 */
function getRandomScene() {
  return SceneModel.countDocuments().then( (count) => {
    // Get a random entry
    let random = 7
    console.log('Random: ' + random);
    return SceneModel.findOne({posted: false}).skip(random);
  });
}

function postSceneWithSingleMedia(scene) {
  let media = scene.scenes[0];
  let mediaData = media.data
  let buff = Buffer.from(media.data, 'base64');
  let mediaType = media.contentType
  let mediaSize = buff.byteLength;
  twitterMedia.uploadSingleMedia(mediaType, mediaSize, mediaData).then( (mediaId) => {
    // Make post request on media endpoint. 
    let status = {
      media_ids: mediaId // Pass the media id string
    }
    twitterMedia.makePost('statuses/update', status).then( () =>
      console.log('Sent a Tweet!')
    )
  })
}

function postSceneWithMultipleImages(scene) {
  let promiseArr = [];
  for (let i = 0; i < scene.scenes.length; i++) {
    let image = scene.scenes[i];
    let mediaData = image.data
    let buff = Buffer.from(image.data, 'base64');
    let mediaType = image.contentType
    let mediaSize = buff.byteLength;
    let promise = twitterMedia.uploadSingleMedia(mediaType, mediaSize, mediaData);
    promiseArr.push(promise);
  }
  Promise.all(promiseArr).then( (mediaIds) => {
    let mediaIdsStr = mediaIds.join();
    let status = {
      media_ids: mediaIdsStr // Pass the media id string
    }
    twitterMedia.makePost('statuses/update', status).then( () =>
      console.log('Sent a tweet with multiple images!')
    );
  })
}