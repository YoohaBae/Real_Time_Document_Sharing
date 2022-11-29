const express = require('express');
const initialize = require('./rabbitmq');

let connection, channel;
initialize().then(([conn, chan]) => {
  connection = conn;
  channel = chan;
})

const User = require('./models/user-model');
const memcached = require('./memcached');

const queue = 'updates'

const app = express();
const port = 9000;

const jsonToUint8Array = (object) => {
  let ret = null;
  ret = new Uint8Array(Object.keys(object).length);
  for (let key in object) {
    // @ts-ignore
    ret[key] = object[key];
  }
  return ret;
};

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

app.use(auth);

app.post('/api/op/:id', async (req, res) => {
    res.json({});
    const docId = req.params.id.toString();
    const clientID = req.body.clientID;
    const update = req.body.update;
    const array = jsonToUint8Array(update);
    const queue_data = {
        update: array,
        clientID: clientID,
        editTime: Date.now(),
        docId: docId
    };
    await channel.assertQueue(queue, {
        durable: true
      });
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(queue_data)), {
        persistent: true
      });
});

app.listen(port, () => {
    console.log(`server is listening at localhost:${port}`);
});