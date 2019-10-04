var Twitter = require('twitter');
var config = require('./config.js');
// const express = require("express");
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const SceneModel = require('./models/Scene').SceneModel;
const twitterMedia = require('./twitter_media');
const Gridfs = require('gridfs-stream');

const T = new Twitter(config);
const DB_NAME = 'test';
const IMAGE_PATH = path.join(__dirname, 'assets', 'images');
const DB_URL = 'mongodb://localhost/' + DB_NAME;


// Connect to db
mongoose.connect(DB_URL, {useNewUrlParser: true, connectTimeoutMS: 5000});
const connection = mongoose.connection;
var gfs;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function() {
  console.log("Connected!")
  var mongoDriver = mongoose.mongo;
  gfs = new Gridfs(connection.db, mongoDriver);
  // we're connected!
});

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


/**
 * @function to get a random scene
 * @returns {Promise} with the Scene found
 */
function getRandomScene() {
  return SceneModel.countDocuments().then( (count) => {
    // Get a random entry
    let random = Math.floor(Math.random() * count)
    // let random = 4
    console.log('Random: ' + random);
    return SceneModel.findOne({posted: false}).skip(random);
  });
}

async function postSceneWithSingleMedia(scene) {
  let media = scene.scenes[0];
  let mediaType = media.mediaType;
  let fileName = media.name;
  let fileLength = 0;

  gfs.files.findOne({filename: fileName}, (err, file) => {
    console.log(`File length is: ${file.length}`);
    fileLength = file.length;
    let readStream = gfs.createReadStream({
      filename: fileName
    });

    twitterMedia.initUpload(fileLength, mediaType).then( (mediaId) => {
      let chunkArr = [];
      let promiseArr= [];
      let i = 0;
      readStream.on('data', function(chunk) {
        console.log('got %d bytes of data', chunk.length);
        chunkArr.push(chunk)
        promiseArr.push(twitterMedia.appendUpload(mediaId, chunk, i++))
      });

      readStream.on('end', async function() {
        console.log(`STREAM ENDED`)
        Promise.all(promiseArr).then( () => {
          twitterMedia.finalizeUpload(mediaId).then( (mediaId) => {
            // Make post request on media endpoint. 
            let status = {
              media_ids: mediaId // Pass the media id string
            }
            twitterMedia.makePost('statuses/update', status).then( () => {
              console.log('Sent a Tweet!')
            })
          });
        })
      });
    });
  })
}

function postSceneWithMultipleImages(scene) {
  let promiseArr = [];
  for (let i = 0; i < scene.scenes.length; i++) {
    let image = scene.scenes[i];
    let mediaData = image.data
    let buff = Buffer.from(image.data, 'base64');
    let mediaType = image.mediaType
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

/**
 * Runs promises from array of functions that can return promises
 * in chained manner
 *
 * @param {array} arr - promise arr
 * @return {Object} promise object
 */
function runPromiseInSequence(arr, input) {
  return arr.reduce(
    (promiseChain, currentFunction) => promiseChain.then(currentFunction),
    Promise.resolve(input)
  );
}
async function mapSeries (iterable, action, mediaId) {
  let i = 0;
  for (const x of iterable) {
    await action(mediaId, x, i)
    i++;
    console.log('SUCCESS IN UPLOAD')
  }
}