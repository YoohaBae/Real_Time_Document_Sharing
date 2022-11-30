const express = require('express');
const initialize = require('../rabbitmq');
let connection, channel;
initialize().then(([conn, chan]) => {
  connection = conn;
  channel = chan;
})
const router = express.Router();
const User = require('../models/user-model');
const connections = require('../connections');
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

const jsonToUint8Array = (object) => {
  let ret = null;
  ret = new Uint8Array(Object.keys(object).length);
  for (let key in object) {
    // @ts-ignore
    ret[key] = object[key];
  }
  return ret;
};

router.get('/connect/:id', async (req, res) => {
  const docId = req.params.id.toString();
  connections[req.cookies.id] = res;
  res.cookie('docId', docId, { httpOnly: true });
  // console.log("connection");
  let eventID = 0;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  if (docId in clients) {
    clients[docId].push({req, res, "clientID": req.cookies.id})
  }
  else {
    clients[docId] = [{req, res, "clientID": req.cookies.id}]
  }

  await channel.assertQueue("event-updates");
  channel.consume("event-updates", (message) => {
    const output = JSON.parse(message.content.toString());
    console.log("event update")
    channel.ack(message);
    let updateEvent = "update"
    write(res, eventID, updateEvent, output);
    eventID++;
  })

  await channel.assertQueue("event-cursors");
  channel.consume("event-cursors", (message) => {
    const input = JSON.parse(message.content.toString());
    console.log(input);
    channel.ack(message);
  })

    // let yDoc = null;
    // let emitter = null;
    // let event = 'sync';
    // if (yDocs[docId] !== undefined) {
    //     yDoc = yDocs[docId];
    //     emitter = emitters[docId];
    // } else {
    //     yDoc = new yjs.Doc();
    //     yDocs[docId] = yDoc;
    //     emitter = new EventEmitter();
    //     emitters[docId] = emitter;
    //     cursors[docId] = {};
    // }
    //
    // let state = await yjs.encodeStateAsUpdate(yDoc);
    // let message = {
    //     update: state,
    //     clientID: 'sync',
    //     //presence: cursors[docId],
    // };
    // write(res, eventID, event, message);
    // eventID++;
    //
    // for (let cursorID in cursors[docId]) {
    //     let event = 'presence';
    //     let cursor = cursors[docId][cursorID];
    //     let message = {
    //         session_id: cursor.session_id,
    //         name: cursor.name,
    //         cursor: {
    //             index: cursor.index,
    //             length: cursor.length,
    //         },
    //     };
    //     write(res, eventID, event, message);
    //     eventID++;
    // }
    //
    // yDoc.on('update', (update, origin) => {
    //     let event = 'update';
    //     let message = {
    //         update: update,
    //         clientID: origin,
    //     };
    //     write(res, eventID, event, message);
    //     eventID++;
    // });
    //
    // emitter.on('updateCursor', (cursor) => {
    //     let event = 'presence';
    //     let message = {
    //         session_id: cursor.session_id,
    //         name: cursor.name,
    //         cursor: {
    //             index: cursor.index,
    //             length: cursor.length,
    //         },
    //     };
    //     const cursorArr = cursors[docId];
    //     if (cursorArr) {
    //         if (cursor != null && cursor.index != -1)
    //             cursorArr[cursor.session_id] = cursor;
    //         else {
    //             message = {
    //                 session_id: cursor.session_id,
    //                 name: cursor.name,
    //                 cursor: {},
    //             };
    //             delete cursorArr[cursor.session_id];
    //         }
    //     }
    //     write(res, eventID, event, message);
    //     eventID++;
    // });
    //
    // req.on('close', () => {
    //     emitter.emit('updateCursor', {
    //         session_id: req.cookies.id,
    //         name: req.cookies.name,
    //         index: -1,
    //     });
    // });
});

module.exports = router;
