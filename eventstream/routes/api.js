const express = require('express');
const initialize = require('../rabbitmq');
const { MongodbPersistence } = require('y-mongodb');
const yjs = require('yjs');
const persistence = new MongodbPersistence('mongodb://localhost:27017/Milestone', 'yDocs');
let connection, channel;
initialize().then(([conn, chan]) => {
  connection = conn;
  channel = chan;
  runEventCursorConsumer();
  runEventUpdateConsumer();
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

router.get('/connect/:id', async (req, res) => {
  const docId = req.params.id.toString();
  connections[req.cookies.id] = res;
  res.cookie('docId', docId, { httpOnly: true });
  // console.log("connection");
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

  let eventID = 0;
  persistence.getYDoc(docId).then(async (yDoc) => {
    let syncEvent = "sync";
    let state = yjs.encodeStateAsUpdate(yDoc);
    let data = {
      update: state,
      clientID: 'sync',
    };
    write(res, eventID, syncEvent, data);
    eventID++;
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

async function runEventUpdateConsumer() {
  await channel.assertQueue("event-updates");
  channel.consume("event-updates", (message) => {
    const output = JSON.parse(message.content.toString());
    channel.ack(message);
    let {update, clientID, docId} = output;
    let eventID = 1;
    for (let i=0; i < clients[docId].length; i++) {
      let client = clients[docId][i];
      let updateEvent = "update";
      if (clientID != client["clientID"]) {
        let data = {
          update, clientID
        }
        write(client["res"], eventID, updateEvent, data);
      }
    }
    eventID++;
  })
}

async function runEventCursorConsumer() {
  await channel.assertQueue("event-cursors");
  channel.consume("event-cursors", (message) => {
    const input = JSON.parse(message.content.toString());
    channel.ack(message);
  })
}
module.exports = router;
