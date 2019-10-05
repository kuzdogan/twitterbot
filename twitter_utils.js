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
   * Upload a media in chunks from a readStream (e.g. GridFS readStream).
   * @param {String} mediaType - 'image/jpg' or 'video/mp4' etc.
   * @param {Number} mediaSize - media size in bytes
   * @param {Stream} readStream - stream that media is read from
   * @returns {Promise} Promise- resolving to a mediaId
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
        let readStream = gfs.createReadStream({
          filename: fileName
        });
        // Upload media from the stream.
        initUpload(mediaSize, mediaType).then( (mediaId) => {
          let promiseArr= []; // Store each chunk upload as promises. 
          let segmentIndex = 0; // Index of each chunk of the file.

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

    /**
   * @function to upload a media to the Twitter server
   * @param String mediaType  'image/jpg' or 'video/mp4' etc.
   * @param Number mediaSize  media size in bytes
   * @param String byte data of the media
   * @returns {Promise} resolving to a mediaId
   */
  function uploadSingleMedia(mediaType, mediaSize, mediaData) {
    return initUpload(mediaSize, mediaType) // Declare that you wish to upload some media
    .then( (mediaId) => appendUpload(mediaId, mediaData)) // Send the data for the media
    .then(finalizeUpload) // Declare that you are done uploading chunks
  }
  module.exports = {
    initUpload, appendUpload, finalizeUpload, makePost, uploadSingleMedia, uploadSingleMediaFromStream
  }