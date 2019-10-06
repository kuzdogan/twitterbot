const mongoose = require('mongoose');
const SceneModel = require('./models/Scene').SceneModel;
const twitterUtils = require('./twitter_utils');
const Gridfs = require('gridfs-stream');
const schedule = require('node-schedule');

const DB_NAME = 'test';
const DB_URL = 'mongodb://localhost/' + DB_NAME;


// Connect to db
mongoose.connect(DB_URL, {useNewUrlParser: true, connectTimeoutMS: 5000});
const connection = mongoose.connection;
var gfs; // Var for GridFS
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function() {
  console.log("Connected!")
  var mongoDriver = mongoose.mongo;
  gfs = new Gridfs(connection.db, mongoDriver);
});



var j = schedule.scheduleJob('42 * * * * *', function(){
  // Get a random scene and post it.
  getRandomScene().then( (scene) => {
    let length = scene.medias.length;
    console.log('Scene length is: ' + length);
    postSceneWithMedia(scene);
  })
});

/**
 * Function to get a random scene
 * Looks at the size of the scene collection that are not posted yet
 * and draws a random unposted post.
 * 
 * @returns {Promise} with the Scene found
 */
function getRandomScene() {
  return SceneModel.countDocuments({posted: false}).then( (count) => {
    if (count == 0) { // If no unposted scene found, terminate process.
      console.log('No unposted scene found');
      console.log('Terminating process');
      process.exit();
    }
    // Get a random entry
    let random = Math.floor(Math.random() * count)
    // let random = 7
    // let random = 1;
    console.log('Random: ' + random);
    return SceneModel.findOne({posted: false}).skip(random);
  });
}

/**
 * Takes a scene with one or more media and posts it using read streams.
 * Uses @function twitterUtils.uploadSingleMediaFromStream to upload files and get mediaIds.
 * Finally creates a Twitter status with @function twitterUtils.makepost with the status object 
 * which has the @key media_ids as the ids of uploaded media, seperated by commas.
 * @param {Array} Array of scenes
 * 
 * */
function postSceneWithMedia(scene) {
  mediaIdsPromises = [];

  // Iterate through all the scenes
  for (let i = 0; i < scene.medias.length; i++) {
    let media = scene.medias[i];
    let promise = twitterUtils.uploadSingleMediaFromStream(media, gfs)
    console.log(`The promise is: ${promise}`);
    mediaIdsPromises.push(promise);
  }
  Promise.all(mediaIdsPromises).then( (mediaIds) => {
    let mediaIdsStr = mediaIds.join();
    let status = {
      media_ids: mediaIdsStr // Pass the media id string
    }
    twitterUtils.makePost('statuses/update', status).then( () => {
      console.log('Sent a tweet!');
      scene.posted = true;
      scene.save().then(console.log(`Updated the document`));
    });
  })
}