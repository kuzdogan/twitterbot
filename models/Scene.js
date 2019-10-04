const mongoose = require('mongoose');
const Media = require('./Media');

/**
 * Scenes consist of ImageSchemas
 * We also hold a value posted to not post an already posted Scene again
 */
const SceneSchema = new mongoose.Schema({
  scenes: [Media.MediaSchema],
  posted: Boolean
});

exports.SceneSchema = SceneSchema;
exports.SceneModel = mongoose.model('Scene', SceneSchema);
