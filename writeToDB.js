const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Gridfs = require('gridfs-stream');
const SceneModel =  require('./models/Scene').SceneModel;
const MediaModel =  require('./models/Media').MediaModel;

const IMAGE_PATH = path.join(__dirname, 'assets', 'images');
const GIF_PATH = path.join(__dirname, 'assets', 'gifs');
const VIDEO_PATH = path.join(__dirname, 'assets', 'videos');
const DB_URL = 'mongodb://localhost/test';
var gfs;
// Connect to db
console.log("Connecting to db")
mongoose.connect(DB_URL, {useNewUrlParser: true, connectTimeoutMS: 5000});
var connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function() {
console.log("Connected!")
// we're connected!

var mongoDriver = mongoose.mongo;
gfs = new Gridfs(connection.db, mongoDriver);
writeImageInPath(IMAGE_PATH).then( () => {
  writeMediaInPath(GIF_PATH).then( () => {
    console.log('Finished Writing to DB');
    process.exit();
  })
})
  // writeMediaInPath(VIDEO_PATH);

});
/**
 * Writes the images in a directory to the database
 * Assumes the consecutive naming convention mentioned above e.g. 1-1, 2-4, 5-3 etc.
 * 
 * @param {String} IMAGE_PATH - The directory where images reside 
 */
function writeImageInPath(IMAGE_PATH) {
  console.log(IMAGE_PATH)
  let promises = []; // Promises to be resolved for uploading images.
  return new Promise((resolve, reject) => {
    fs.readdir(IMAGE_PATH, (err, files) => {
      console.log(`Read the Directory`);
      for (let i = 0; i < files.length; i++) {
        let filePath = path.join(IMAGE_PATH, files[i])
        let fileName = files[i];
        // Create a scene
        let newScene = new SceneModel();
        console.log('Adding scene')
        let imgArr = [] // Hold images/media in an array
        
        // Add first Image by default
        let newImage = new MediaModel();
        console.log('Adding image ' + fileName)
        newImage.name = files[i];
        let base = path.parse(filePath).name
        let ext = path.parse(filePath).ext
        newImage.mediaType = 'image/' + ext.slice(1);
        imgArr.push(newImage);

        // Write image to GridFS
        let streamPromise = writeWithStream(filePath, fileName)
        promises.push(streamPromise);
        
    
        // Checking next image
        let nextNum = 2 // 22-2
        let nextName = base.slice(0, -1) + nextNum + ext; // 22-2.jpg
        console.log(`Nextname: ${nextName} and real next name ${files[i+1]}`)
        // Check if there is another image in the same scene.
        // E.g. if we added image 22-1, check for 22-2, 22-3... until the next, 23-1
        while(nextName === files[i+1]){
          console.log('Name matched!')
          i++;
          filePath = path.join(IMAGE_PATH, files[i])
          fileName = files[i];
          subImage = new MediaModel();
          console.log('Adding image ' + fileName)
          console.log(`i is ${i}`);
          subImage.name = files[i];
          
          // Write image to GridFS
          let streamPromise2 = writeWithStream(filePath, fileName);
          promises.push(streamPromise2);
          ext = path.extname(filePath)
          subImage.mediaType = 'image/' + ext.slice(1);
          imgArr.push(subImage);
          nextNum++;
          nextName = base.slice(0, -1) + nextNum + '.' + ext;
        }
        newScene.medias = imgArr;
        newScene.posted = false;
        let savePromise = newScene.save().then(console.log(`Saved Scene ${i}`));
        promises.push(savePromise);
      }

      Promise.all(promises).then(()=>{
      console.log(`Resolved`);
      resolve(); // Resolve the returning Promise.
    }).catch((err) => reject(err))
    })
  })
}

/**
 * Writes media (gif, videos) to the database
 * Diffent than @function writeImageInPath assumes consequtive file naming: 1.gif, 2.gif...
 * 
 * @param {String} MEDIA_PATH 
 */
function writeMediaInPath(MEDIA_PATH) {
  let promises = []; // Promises to be resolved for uploading images.
  return new Promise((resolve, reject) => {
    fs.readdir(MEDIA_PATH, (err, files) => {
      console.log(`Read the Directory`);
      for (let i = 0; i < files.length; i++) {
        let filePath = path.join(MEDIA_PATH, files[i])
        let fileName = files[i];
        // Create a scene
        let newScene = new SceneModel();
        console.log('Adding scene')
        let mediaArr = [] // Hold images/media in an array
        
        // Add first Image by default
        let newImage = new MediaModel();
        console.log('Adding image ' + fileName)
        newImage.name = files[i];
        let base = path.parse(filePath).name
        let ext = path.parse(filePath).ext
        newImage.mediaType = 'image/' + ext.slice(1);
        mediaArr.push(newImage);

        // Write image to GridFS
        let streamPromise = writeWithStream(filePath, fileName);
        promises.push(streamPromise);
        newScene.medias = mediaArr;
        newScene.posted = false;
        let savePromise = newScene.save().then(console.log(`Saved Scene ${i}`));
        promises.push(savePromise);
      }

      Promise.all(promises).then(()=>{
      console.log(`Resolved`);
      resolve(); // Resolve the returning Promise.
    }).catch((err) => reject(err))
    })
  })
}

/**
 * Function to write media to the GridFs.
 * 
 * @param {String} filePath 
 * @param {String} fileName
 * @returns {Promise} Promise that resolves when writing operation is complete. 
 */
function writeWithStream(filePath, fileName) {
  return new Promise( (resolve, reject) => {
    let writestream = gfs.createWriteStream({ filename: fileName });
    fs.createReadStream(filePath).pipe(writestream);
    writestream.on('finish', () => {
      resolve()
    })
    writestream.on('error', (error) => {
      console.error(error);
      reject('Error in writing to GridFS')
    })
  })
}