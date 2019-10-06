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
  console.log('Finished Writing to DB');
  process.exit();
})
  // writeImageInPath(IMAGE_PATH)
  // .then( (result) =>{
  //   console.log(result);
  //   writeMediaInPath(GIF_PATH);
  // })
  
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
  let promises = [];
  return new Promise((resolve, reject) => {
    fs.readdir(IMAGE_PATH, (err, files) => {
      console.log(`Read the Directory`);
      // for (let i = 0; i < 2; i++) {
      for (let i = 0; i < files.length; i++) {
        let filePath = path.join(IMAGE_PATH, files[i])
        let fileName = files[i];
        // Create a scene
        let newScene = new SceneModel();
        console.log('Adding scene')
        let imgArr = [] // Hold images in an array
        
        // Add first Image by default
        let newImage = new MediaModel();
        console.log('Adding image ' + fileName)
        newImage.name = files[i];
        // newImage.data = fs.readFileSync(filePath).toString('base64');
        let streamPromise = writeWithStream(filePath, fileName)
        promises.push(streamPromise);
        let base = path.parse(filePath).name
        let ext = path.parse(filePath).ext
        newImage.mediaType = 'image/' + ext.slice(1);
        imgArr.push(newImage);
    
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
          // subImage.data = fs.readFileSync(filePath).toString('base64');
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
    console.log(promises)
    Promise.all(promises).then(()=>{
      console.log(`Resolved`);
      resolve();
    }).catch((err) => reject(err))
    })
  })
}

function writeMediaInPath(MEDIA_PATH) {
  let promises = [];
  fs.readdir(MEDIA_PATH, (err, files) => {
    for (let i = 0; i < files.length; i++) {
      let filePath = path.join(MEDIA_PATH, files[i])
      let fileName = files[i];
      // Create a scene
      let newScene = new SceneModel();
      console.log('Adding scene ' + fileName)
      let mediaArr = []
      // Add first Image by default
      let newMedia = new MediaModel();
      let base = path.parse(filePath).name
      let ext = path.parse(filePath).ext

      // Write Media Type
      if (ext === '.gif' || ext === '.jpg' || ext === '.jpeg' || ext === '.png')
        newMedia.mediaType = 'image/' + ext.slice(1);
      else if (ext === '.mp4')
        newMedia.mediaType = 'video/' + ext.slice(1);
      else throw new Error('Media type error')

      console.log('Adding new ' + ext)
      newMedia.name = files[i];
      let writestream = gfs.createWriteStream({ filename: fileName });
      fs.createReadStream(filePath).pipe(writestream);
      mediaArr.push(newMedia);
      
      newScene.medias = mediaArr;
      newScene.posted = false;
      let savePromise = newScene.save()
        .then( () => console.log('Saved scene ' + fileName) )
        .catch( (err) => {
          console.log('Error saving media ' + fileName);
          console.log(err);
        })
      promises.push(savePromise);
    }
  })
  return Promise.all(promises);
}

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