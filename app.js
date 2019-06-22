var Twitter = require('twitter');
var config = require('./config.js');
// const express = require("express");
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const IMAGE_PATH = path.join(__dirname, 'assets', 'images');

var T = new Twitter(config);
mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});

var ImageSchema = new mongoose.Schema({
  name: String,
  data: Buffer, 
  contentType: String,
})
var SceneSchema = new mongoose.Schema({
  scenes: [ImageSchema],
  posted: Boolean
});


var Scene = db.model('Scene', SceneSchema);
var Image = db.model('Image', ImageSchema);

fs.readdir(IMAGE_PATH, (err, files) => {

  for (let i = 0; i < 10 /*files.length*/; i++) {
    var filePath = path.join(IMAGE_PATH, files[i])
    var fileName = files[i];
    // Create a scene
    var newScene = new Scene();
    console.log('Adding scene')
    var imgArr = []
    // Add first Image by default
    var newImage = new Image();
    console.log('Adding image ' + fileName)
    newImage.name = files[i];
    newImage.data = fs.readFileSync(filePath);
    var base = path.parse(filePath).name
    var ext = path.parse(filePath).ext
    newImage.contentType = 'image/' + ext.slice(1);
    imgArr.push(newImage);

    // Checking next image
    var nextNum = 2
    var nextName = base.slice(0, -1) + nextNum + ext;
    console.log(`Nextname: ${nextName} and real next name ${files[i+1]}`)
    while(nextName === files[i+1]){
      console.log('Name matched!')
      // If names match e.g. 10-2, 10-3...
      i++;
      filePath = path.join(IMAGE_PATH, files[i])
      fileName = files[i];
      subImage = new Image();
      console.log('Adding image ' + fileName)
      console.log(`i is ${i}`);
      subImage.name = files[i];
      subImage.data = fs.readFileSync(filePath);
      ext = path.extname(filePath)
      subImage.contentType = 'image/' + ext.slice(1);
      imgArr.push(subImage);
      nextNum++;
      nextName = base.slice(0, -1) + nextNum + '.' + ext;
    }
    newScene.scenes = imgArr;
    newScene.posted = false;
    newScene.save();
    console.log('Saved scene')
  }

  
})

// const Images
// T.post('statuses/update', {status: 'I Love Twitter'})
//   .then(function (tweet) {
//     console.log(tweet);
//   })
//   .catch(function (error) {
//     throw error;
//   })