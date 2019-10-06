const mongoose = require('mongoose');
const Media = require('./Media');

/**
 * Schema representing each scene to be posted.
 * 
 * @key medias
 * Array of Media to be posted. Refer to MediaSchema.
 * 
 * @key posted
 * Bool to mark if scene is already posted or not.
 * 
 * Scenes can consist of multiple Media.
 * We also hold a value posted to not post an already posted Scene again
 */
const SceneSchema = new mongoose.Schema({
  medias: [Media.MediaSchema],
  posted: Boolean
});

exports.SceneSchema = SceneSchema;
exports.SceneModel = mongoose.model('Scene', SceneSchema);
