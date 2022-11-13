const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const User = require('../models/user-model');

const router = express.Router();

const mediaDir = path.join(__dirname, '/../media/');

if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mediaDir);
  },
  filename: function (req, file, cb) {
    const uniquePre = Date.now() + Math.round(Math.random() * 1e9);
    const type = file.mimetype.split('/')[1];
    cb(null, uniquePre + '.' + type);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
}).single('file');

const auth = async (req, res, next) => {
  const key = req.cookies.key;
  if (!key) {
    res.send({
      error: true,
      message: 'User is not authenticated',
    });
  } else {
    try {
      const user = await User.findOne({ key });
      if (!user) {
        res.send({
          error: true,
          message: 'User is not authenticated',
        });
      } else {
        next();
      }
    } catch {
      res.send({
        error: true,
        message: 'User is not authenticated',
      });
    }
  }
};

router.use(auth);

router.post('/upload', upload, (req, res) => {
  const image = req.file;
  console.log(image);
  if (image === undefined) {
    res.send({
      error: true,
      message: 'Image is not defined',
    });
    return;
  }
  const { mimetype, filename } = image;
  const mediaid = filename.split('.')[0];
  if (
    mimetype == 'image/png' ||
    mimetype == 'image/jpg' ||
    mimetype == 'image/jpeg'
  ) {
    res.send({
      mediaid,
    });
  } else {
    res.send({
      error: true,
      message: 'Uploaded File must be of type jpg or png',
    });
  }
});

router.get('/access/:mediaid', (req, res) => {
  const id = req.params.mediaid;
  const file1 = mediaDir + id + '.jpeg';
  const file2 = mediaDir + id + '.jpg';
  const file3 = mediaDir + id + '.png';
  if (fs.existsSync(file1)) {
    res.sendFile(file1);
  } else if (fs.existsSync(file2)) {
    res.sendFile(file2);
  } else if (fs.existsSync(file3)) {
    res.sendFile(file3);
  } else {
    res.send({
      error: true,
      message: 'File not Found',
    });
  }
});

module.exports = router;
