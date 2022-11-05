const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema(
    {
        email: {type: String, required: true, unique: true},
        name: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        key: {type: String},
        emailVerified: {type: Boolean, default: false}
    },
    {timestamps: true}
);

module.exports = mongoose.model("User", UserSchema);