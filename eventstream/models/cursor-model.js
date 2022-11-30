const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//const ObjectId = Schema.Types.ObjectId;

const CursorSchema = new Schema(
  {
    name: { type: String, required: true },
    session_id: {type: String, required: true},
    docId: { type: Number, unique: true},
    index: {type: Number, required: true},
    length: {type: Number}
  }
);

module.exports = mongoose.model('Cursor', CursorSchema);
