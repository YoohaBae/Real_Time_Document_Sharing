const express = require('express');
const yjs = require('yjs');
const { LeveldbPersistence } = require('y-leveldb');
const router = express.Router();
const User = require('../models/user-model');
const connections = require('../connections');
const EventEmitter = require('events');

const yDocs = {};
const emitters = {};
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
  const key = req.session.key;
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

router.get('/connect/:id', async (req, res) => {
  const docId = req.params.id.toString();
  connections[req.session.id] = res;
  let eventID = 0;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
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
    presence: cursors[docId],
  };
  write(res, eventID, event, message);
  eventID++;

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
    console.log(cursor);
    let event = 'presence';
    let message = {
      sessionId: cursor.sessionId,
      name: cursor.name,
      cursor: {
        index: cursor.index,
        length: cursor.length,
      },
    };
    write(res, eventID, event, message);
    eventID++;
  });
});

router.post('/op/:id', async (req, res) => {
  const docId = req.params.id.toString();
  const clientID = req.body.clientID;
  let array = jsonToUint8Array(req.body.update);
  let ydoc = yDocs[docId];
  //let ydoc = persistence.getYDoc(id)
  yjs.applyUpdate(ydoc, array, clientID);
  yDocs[docId] = ydoc;
  let data = yDocs[docId].getText(docId);
  console.log('changed: ' + data);
  res.send('Successfully pushed event');
});

router.post('/presence/:id', async (req, res) => {
  const docId = req.params.id.toString();
  const emitter = emitters[docId];
  const cursorArr = cursors[docId];
  const { index, length } = req.body;
  const cursorData = {
    index,
    length,
    sessionId: req.session.id,
    name: req.session.name,
  };
  if (cursorArr) {
    cursorArr[req.session.id] = cursorData;
  }
  if (emitter) {
    emitter.emit('updateCursor', cursorData);
    res.send();
  } else {
    res.send({
      error: true,
      message: 'Server Error',
    });
  }
});

module.exports = router;
