var Twitter = require('twitter');
var config = require('./config.js');
// const express = require("express");
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const T = new Twitter(config);
import SceneModel from './models/Scene';

const IMAGE_PATH = path.join(__dirname, 'assets', 'images');
const DB_URL = 'mongodb://localhost/test';


// Connect to db
mongoose.connect(DB_URL, {useNewUrlParser: true});
var db = mongoose.test;

SceneModel.find({}).then((docs) => {
  console.log(docs)
})

var scene = db.scenes.findOne();
console.log(scene);
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