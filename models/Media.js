const mongoose = require('mongoose');

/**
 * MediaSchema represents a screenshot image, a scene gif or a video of the scene.
 * 
 * @key name 
 * The name of the image. In our case media are named with the following pattern:
 * <image-name>-<scene-number>.<file-format>
 * scene-number is between 1 and 4 as a single tweet has max 4 images
 * 
 * Example: 
 *   1-1 first image of the first scene = 1-1.jpg
 *   2-4 fourth image of the second scene = 2-4.jpg
 *   4   fourth video = 4.mp4
 *   7   seventh gif = 7.gif
 * 
 * @key mediaType
 * Media type in MIME format. e.g. image/jpg, video/mp4
 * 
 * Schema does not contain media data as it is stored in GridFS
 * 
 * Gifs and Videos don't need extensions as each tweet can only have one gif or video.
 * Images can be up to 4.
 */
const MediaSchema = new mongoose.Schema({
  name: String,
  mediaType: String,
})

exports.MediaSchema = MediaSchema;
exports.MediaModel = mongoose.model('Media', MediaSchema);