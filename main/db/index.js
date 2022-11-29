const mongoose = require('mongoose');

const url = 'mongodb://localhost:27017/Milestone';
mongoose.connect(url, { useNewUrlParser: true }).catch((e) => {
  console.error('Connection error', e.message);
});

const db = mongoose.connection;

module.exports = db;
