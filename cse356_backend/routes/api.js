const express = require('express');
const yjs = require('yjs');
//const { LeveldbPersistence } = require('y-leveldb');
const router = express.Router();
const User = require('../models/user-model');
const connections = require('../connections');
const emitters = require('../emitters');
const EventEmitter = require('events');
const Collection = require('../models/collection-model');

// const elasticClient = require("../elasticsearch")
EventEmitter.setMaxListeners(0);

const yDocs = require("../ydocs");
const updatedDocIds = require("../updatedDocIds");
const cursors = {};


//const persistence = new LeveldbPersistence('./db-storage')

function write(res, id, event, data) {
  res.write(`id: ${id}\n`);
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

const jsonToUint8Array = (object) => {
  let ret = null;
  ret = new Uint8Array(Object.keys(object).length);
  for (let key in object) {
    // @ts-ignore
    ret[key] = object[key];
  }
  return ret;
};

const auth = async (req, res, next) => {
  console.log("cookies: ");
  // console.log(req.cookies)
  // console.log(req.cookies.key);
  console.log("requesting auth")
  const key = req.cookies.key;
  if (!key) {
    console.log("no key")
    res.send({
      error: true,
      message: 'User is not authenticated',
    });
  } else {
    try {
      const user = await User.findOne({ key });
      if (!user) {
        console.log("user not auth")
        res.send({
          error: true,
          message: 'User is not authenticated',
        });
      } else {
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
};

router.use(auth);

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
  let yDoc = null;
  let emitter = null;
  let event = 'sync';
  if (yDocs[docId] !== undefined) {
    yDoc = yDocs[docId];
    emitter = emitters[docId];
  } else {
    yDoc = new yjs.Doc();
    yDocs[docId] = yDoc;
    emitter = new EventEmitter();
    emitters[docId] = emitter;
    cursors[docId] = {};
  }

  let state = await yjs.encodeStateAsUpdate(yDoc);
  let message = {
    update: state,
    clientID: 'sync',
    //presence: cursors[docId],
  };
  write(res, eventID, event, message);
  eventID++;

  for (let cursorID in cursors[docId]) {
    let event = 'presence';
    let cursor = cursors[docId][cursorID];
    let message = {
      session_id: cursor.session_id,
      name: cursor.name,
      cursor: {
        index: cursor.index,
        length: cursor.length,
      },
    };
    write(res, eventID, event, message);
    eventID++;
  }

  yDoc.on('update', (update, origin) => {
    let event = 'update';
    let message = {
      update: update,
      clientID: origin,
    };
    write(res, eventID, event, message);
    eventID++;
  });

  emitter.on('updateCursor', (cursor) => {
    let event = 'presence';
    let message = {
      session_id: cursor.session_id,
      name: cursor.name,
      cursor: {
        index: cursor.index,
        length: cursor.length,
      },
    };
    const cursorArr = cursors[docId];
    if (cursorArr) {
      if (cursor != null && cursor.index != -1)
        cursorArr[cursor.session_id] = cursor;
      else {
        message = {
          session_id: cursor.session_id,
          name: cursor.name,
          cursor: {},
        };
        delete cursorArr[cursor.session_id];
      }
    }
    write(res, eventID, event, message);
    eventID++;
  });

  req.on('close', () => {
    emitter.emit('updateCursor', {
      session_id: req.cookies.id,
      name: req.cookies.name,
      index: -1,
    });
  });
});

router.post('/op/:id', async (req, res) => {
  const docId = req.params.id.toString();
  const clientID = req.body.clientID;
  let array = jsonToUint8Array(req.body.update);
  let ydoc = yDocs[docId];
  //let ydoc = persistence.getYDoc(id)
  yjs.applyUpdate(ydoc, array, clientID);
  //yjs.logUpdate(array);
  yDocs[docId] = ydoc;
  let filter = { id: docId };
  let update = { editTime: Date.now() };
  Collection.findOneAndUpdate(filter, update);
  updatedDocIds.add(docId);
  // let data = yDocs[docId].getText(docId);
  res.json({});
});

router.post('/presence/:id', async (req, res) => {
  const docId = req.params.id.toString();
  const emitter = emitters[docId];
  // const cursorArr = cursors[docId];
  const { index, length } = req.body;
  const cursorData = {
    index,
    length,
    session_id: req.cookies.id,
    name: req.cookies.name,
  };
  // if (cursorArr) {
  //   cursorArr[req.session.id] = cursorData;
  // }
  if (emitter) {
    emitter.emit('updateCursor', cursorData);
    res.json({});
  } else {
    res.send({
      error: true,
      message: 'Server Error',
    });
  }
});

module.exports = router;
