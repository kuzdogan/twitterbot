const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Gridfs = require('gridfs-stream');
const SceneModel =  require('./models/Scene').SceneModel;
const MediaModel =  require('./models/Media').MediaModel;
const config = require('./config.js');
const cliProgress = require('cli-progress');

const IMAGE_PATH = path.join(__dirname, 'assets', 'images');
const GIF_PATH = path.join(__dirname, 'assets', 'gifs');
const VIDEO_PATH = path.join(__dirname, 'assets', 'videos');

const DB_NAME = config.db_name;
const DB_URL = 'mongodb+srv://' + config.db_user + ':' + config.db_password + '@' + config.db_url + DB_NAME;
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
  return new Promise((resolve, reject) => {
    fs.readdir(IMAGE_PATH, async (err, files) => {
      console.log(`Read the Directory`);
      for (let i = 0; i < files.length; i++) {
      // for (let i = 0; i < 5; i++) {
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
        await writeWithStream(filePath, fileName);
    
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
          await writeWithStream(filePath, fileName)
          ext = path.extname(filePath)
          subImage.mediaType = 'image/' + ext.slice(1);
          imgArr.push(subImage);
          nextNum++;
          nextName = base.slice(0, -1) + nextNum + '.' + ext;
        }
        newScene.medias = imgArr;
        newScene.posted = false;
        await newScene.save().then(console.log(`Image ${i} saved. Scenes to go: ${files.length - i}`));
      }

      console.log(`Resolved`);
      resolve(); // Resolve the returning Promise.
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
  return new Promise((resolve, reject) => {
    fs.readdir(MEDIA_PATH, async (err, files) => {
      console.log(`Read the Directory`);
      for (let i = 0; i < files.length; i++) {
      // for (let i = 0; i < 1; i++) {
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
        await writeWithStream(filePath, fileName);
        newScene.medias = mediaArr;
        newScene.posted = false;
        await newScene.save().then(console.log(`Image ${i} saved. Scenes to go: ${files.length - i}`));
      }

      console.log(`Resolved`);
      resolve(); // Resolve the returning Promise.
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
    let readstream = fs.createReadStream(filePath);
    let stats = fs.statSync(filePath);
    let totalBytes = stats["size"];
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(totalBytes, 0);

    readstream.pipe(writestream);

    readstream.on('data', (chunk) => {
      progressBar.increment(chunk.length)
    })
    writestream.on('finish', () => {
      console.log(); // New line after progress bar
      resolve()
    })
    writestream.on('error', (error) => {
      console.error(error);
      reject('Error in writing to GridFS')
    })
  })
}