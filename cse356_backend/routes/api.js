const express = require('express');
const yjs = require('yjs');
const toUint8Array = require('base64-to-uint8array');
const { LeveldbPersistence } = require('y-leveldb');
const router = express.Router();
const User = require('../models/user-model');

const yDocs = {};

//const persistence = new LeveldbPersistence('./db-storage')

function write(res, id, event, data) {
  res.write(`id: ${id}\n`);
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

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

router.get('/connect/:id', async (req, res) => {
  const docId = req.params.id.toString();
  let eventID = 0;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  let yDoc = null;
  let event = 'sync';
  if (yDocs[docId] !== undefined) {
    yDoc = yDocs[docId];
  } else {
    yDoc = new yjs.Doc();
    yDocs[docId] = yDoc;
  }

  let state = await yjs.encodeStateAsUpdate(yDoc);
  let message = {
    update: state,
    clientID: 'sync',
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
});

router.post('/op/:id', async (req, res) => {
  console.log('User Authenticated');
  const docId = req.params.id.toString();
  const clientID = req.body.clientID;
  const update = req.body.update;
  let array = toUint8Array(update);
  let ydoc = yDocs[docId];
  //let ydoc = persistence.getYDoc(id)
  yjs.applyUpdate(ydoc, array, clientID);
  yDocs[docId] = ydoc;
  let data = yDocs[docId].getText(docId);
  console.log('changed: ' + data);
  res.send('Successfully pushed event');
});

module.exports = router;
