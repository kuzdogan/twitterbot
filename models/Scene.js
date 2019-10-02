const mongoose = require('mongoose');
const Image = require('./Image');

/**
 * Scenes consist of ImageSchemas
 * We also hold a value posted to not post an already posted Scene again
 */
const SceneSchema = new mongoose.Schema({
  scenes: [Image.ImageSchema],
  posted: Boolean
});

exports.SceneSchema = SceneSchema;
exports.SceneModel = mongoose.model('Scene', SceneSchema);
