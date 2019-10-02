const mongoose = require('mongoose');

/**
 * ImageSchema represents a screenshot image 
 * name: The name of the image. In our case images are named with the following pattern:
 *  <image-name>-<scene-number> 
 *  scene-number is between 1 and 4 as a single tweet has max 4 images
 * 
 *  Example: 
 *    1-1 first image of the first scene
 *    2-4 fourth image of the second scene
 */
const ImageSchema = new mongoose.Schema({
  name: String,
  data: String, 
  contentType: String,
})

exports.ImageSchema = ImageSchema;
exports.ImageModel = mongoose.model('Image', ImageSchema);