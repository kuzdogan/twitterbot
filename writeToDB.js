const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const SceneModel =  require('./models/Scene').SceneModel;
const ImageModel =  require('./models/Image').ImageModel;

const IMAGE_PATH = path.join(__dirname, 'assets', 'images');
const DB_URL = 'mongodb://localhost/test';

// Connect to db
console.log("Connecting to db")
mongoose.connect(DB_URL, {useNewUrlParser: true, connectTimeoutMS: 5000});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected!")
  // we're connected!
});


writeScenesInPath(IMAGE_PATH);
/**
 * Writes the images in a directory to the database
 * Assumes the consecutive naming convention mentioned above e.g. 1-1, 2-4, 5-3 etc.
 * 
 * @param {String} IMAGE_PATH - The directory where images reside 
 */
function writeScenesInPath(IMAGE_PATH) {
  console.log(IMAGE_PATH)
  fs.readdir(IMAGE_PATH, (err, files) => {
    for (let i = 0; i < 10 /*files.length*/; i++) {
      var filePath = path.join(IMAGE_PATH, files[i])
      var fileName = files[i];
      // Create a scene
      var newScene = new SceneModel();
      console.log('Adding scene')
      var imgArr = [] // Hold images in an array
      
      // Add first Image by default
      var newImage = new ImageModel();
      console.log('Adding image ' + fileName)
      newImage.name = files[i];
      newImage.data = fs.readFileSync(filePath).toString('base64');
      var base = path.parse(filePath).name
      var ext = path.parse(filePath).ext
      newImage.contentType = 'image/' + ext.slice(1);
      imgArr.push(newImage);
  
      // Checking next image
      var nextNum = 2 // 22-2
      var nextName = base.slice(0, -1) + nextNum + ext; // 22-2.jpg
      console.log(`Nextname: ${nextName} and real next name ${files[i+1]}`)
      // Check if there is another image in the same scene.
      // E.g. if we added image 22-1, check for 22-2, 22-3... until the next, 23-1
      while(nextName === files[i+1]){
        console.log('Name matched!')
        i++;
        filePath = path.join(IMAGE_PATH, files[i])
        fileName = files[i];
        subImage = new ImageModel();
        console.log('Adding image ' + fileName)
        console.log(`i is ${i}`);
        subImage.name = files[i];
        subImage.data = fs.readFileSync(filePath).toString('base64');
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
}
