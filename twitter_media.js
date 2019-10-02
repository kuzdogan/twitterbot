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
  function appendUpload (mediaId, mediaData) {
    return makePost('media/upload', {
      command      : 'APPEND',
      media_id     : mediaId,
      media_data   : mediaData,
      segment_index: 0
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
    }).then(data => mediaId);
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
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }
  /**
   * @function to upload a media to the Twitter server
   * @param String mediaType  'image/jpg' or 'video/mp4' etc.
   * @param Number mediaSize  media size in bytes
   * @param String base64 data of the media
   * @returns {Promise} resolving to a mediaId
   */
  function uploadSingleMedia(mediaType, mediaSize, mediaData) {
    return initUpload(mediaSize, mediaType) // Declare that you wish to upload some media
    .then( (mediaId) => appendUpload(mediaId, mediaData)) // Send the data for the media
    .then(finalizeUpload) // Declare that you are done uploading chunks
  }

  module.exports = {
    initUpload, appendUpload, finalizeUpload, makePost, uploadSingleMedia
  }