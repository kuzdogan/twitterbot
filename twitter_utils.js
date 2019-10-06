var Twitter = require('twitter');
var config = require('./config.js');
const T = new Twitter(config);

  /**
   * Step 1 of 3: Initialize a media upload
   * @return Promise resolving to String mediaId
   */
  function initUpload (mediaSize, mediaType) {
    return makePost('media/upload', {
      command    : 'INIT',
      total_bytes: mediaSize,
      media_type : mediaType,
    }).then(data => data.media_id_string);
  }

  /**
   * Step 2 of 3: Append file chunk
   * @param String mediaId    Reference to media object being uploaded
   * @return Promise resolving to String mediaId (for chaining)
   */
  function appendUpload (mediaId, mediaDataBin, segmentIndex) {
    return makePost('media/upload', {
      command      : 'APPEND',
      media_id     : mediaId,
      media   : mediaDataBin,
      segment_index: segmentIndex
    }).then(data => mediaId);
  }

  /**
   * Step 3 of 3: Finalize upload
   * @param String mediaId   Reference to media
   * @return Promise resolving to mediaId (for chaining)
   */
  function finalizeUpload (mediaId) {
    return makePost('media/upload', {
      command : 'FINALIZE',
      media_id: mediaId
    }).then(data => mediaId).catch((err) => {
      console.log(`Error in finalizing`);
      console.log(err)
    });
  }

  /**
   * (Utility function) Send a POST request to the Twitter API
   * @param String endpoint  e.g. 'statuses/upload'
   * @param Object params    Params object to send
   * @return Promise         Rejects if response is error
   */
  function makePost (endpoint, params) {
    return new Promise((resolve, reject) => {
      T.post(endpoint, params, (error, data, response) => {
        console.log(params)
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Upload a single media in chunks from a readStream (e.g. GridFS readStream).
   * 
   * First finds the file in GridFS to retrieve metadata. 
   * Starts the upload to get a mediaId from Twitter with @function initUpload .
   * Reads from the GridFS stream and uploads each chunk with @function appendUpload .
   * Once all chunk uploads are resolved, finalizes the upload with @function finalizeUpload .
   *  
   * @param {Object} media object retrieved from the DB
   * @param {Object} gfs to read the file from GridFS in Stream
   * @returns {Promise} Promise - resolving to a mediaId
   */
  function uploadSingleMediaFromStream(media, gfs) {
    let mediaType = media.mediaType;
    let fileName = media.name;
    let mediaSize = 0;

    return new Promise( (resolve, reject) => {
       // Retrieve the file from GridFS store
      gfs.files.findOne({filename: fileName}, (err, file) => {
        if (err) {
          reject(err);
        }

        console.log(`File length is: ${file.length}`);
        mediaSize = file.length;
        let readStream = gfs.createReadStream({ // Uses Node Stream type
          filename: fileName
        });
        // Upload media from the stream.
        initUpload(mediaSize, mediaType).then( (mediaId) => {
          let promiseArr= []; // Store each chunk upload as promises. 
          let segmentIndex = 0; // Index of each chunk of the file.

          // Subscribe to data flow. This automatically starts retrieving data.
          readStream.on('data', (chunk) => { 
            console.log('got %d bytes of data', chunk.length);
            promiseArr.push(appendUpload(mediaId, chunk, segmentIndex++)); 
          });

          // When stream finishes start uploading.
          readStream.on('end', () => {
            console.log(`STREAM ENDED`)
            Promise.all(promiseArr).then( () => { // Finalize upload when all uploads resolve.
              console.log("Finalizing")
              finalizeUpload(mediaId).then( (mediaId) => {
                resolve(mediaId);
              });
            }).catch( (err) => reject(err));
          });
        });
      })
    })
   
  }

  module.exports = {
    initUpload, appendUpload, finalizeUpload, makePost, uploadSingleMediaFromStream
  }