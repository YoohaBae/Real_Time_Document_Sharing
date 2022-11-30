const express = require('express');
const initialize = require('../rabbitmq');
let connection, channel;
initialize().then(([conn, chan]) => {
  connection = conn;
  channel = chan;
})
const router = express.Router();
const User = require('../models/user-model');
const EventEmitter = require('events');
const memcached = require('../memcached');

var clients = {}

EventEmitter.setMaxListeners(0);

function write(res, id, event, data) {
  res.write(`id: ${id}\n`);
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getCache(key) {
  memcached.get(key, function(err, data) {
    if (err) {
      console.log("error setting cache");
      console.log(err);
      return false;
    }
    else {
      if (data) {
        return true;
      }
    }
  })
}

function setCache(key) {
  memcached.set(key, 'true', 600, function(err) {
    if (err) {
      console.log("error setting cache");
      console.log(err);
    }
  })
}

const auth = async (req, res, next) => {
  // console.log("cookies: ");
  // console.log(req.cookies)
  // console.log(req.cookies.key);
  // console.log("requesting auth")
  const key = req.cookies.key;
  if (!key) {
    console.log("no key")
    res.send({
      error: true,
      message: 'User is not authenticated',
    });
  } else {
    if (!getCache(key)) {
      try {
        const user = await User.findOne({ key });
        if (!user) {
          console.log("user not auth")
          res.send({
            error: true,
            message: 'User is not authenticated',
          });
        } else {
          setCache(key);
          next();
        }
      } catch {
        console.log("user not auth2")
        res.send({
          error: true,
          message: 'User is not authenticated',
        });
      }
    }
    else {
      console.log("cache login")
    }
  }
};

router.use(auth);

router.post('/presence/:id', async (req, res) => {
  const docId = req.params.id.toString();
  const queue = 'cursors'
  const { index, length } = req.body;
  const cursorQueueData = {
    docId,
    index,
    length,
    session_id: req.cookies.id,
    name: req.cookies.name,
  };
  await channel.assertQueue(queue, {
      durable: true
    });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(cursorQueueData)), {
      persistent: true
    });
  res.json({})
});

module.exports = router;
