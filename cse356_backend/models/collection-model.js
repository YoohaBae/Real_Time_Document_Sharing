const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);
//const ObjectId = Schema.Types.ObjectId;

const CollectionSchema = new Schema(
  {
    name: { type: String, required: true },
    editTime: {type: Date, required: true},
    id: { type: Number},

  },
  { timestamps: true }
);

CollectionSchema.plugin(AutoIncrement, {inc_field: 'id'});
module.exports = mongoose.model('Collection', CollectionSchema);
