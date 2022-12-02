const mongoose = require('mongoose');

const url = 'mongodb://209.151.154.219:27017/Milestone';
mongoose.connect(url, { useNewUrlParser: true }).catch((e) => {
  console.error('Connection error', e.message);
});

const db = mongoose.connection;

module.exports = db;
