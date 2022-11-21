const express = require('express');
const yjs = require('yjs');
//const { LeveldbPersistence } = require('y-leveldb');
const router = express.Router();
const User = require('../models/user-model');
const connections = require('../connections');
const emitters = require('../emitters');
const EventEmitter = require('events');
const Collection = require('../models/collection-model');
const memcached = require('../memcached');

const yDocs = require("../ydocs");
const updatedDocIds = require("../updatedDocIds");
const queue = require("../queue");
const queueDict = require("../queueDict")

EventEmitter.setMaxListeners(0);

const cursors = {};
// const updateDict = {}
// const updateQueue = []

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
  let docId = req.params.id.toString();
  let clientID = req.body.clientID;
  let update = req.body.update;
  let array = jsonToUint8Array(update);
  // let ydoc = yDocs[docId];
  // //let ydoc = persistence.getYDoc(id)
  // yjs.applyUpdate(ydoc, array, clientID);
  // //yjs.logUpdate(array);
  // yDocs[docId] = ydoc;
  let queue_data = {
    // update: req.body.update, 
    // clientID: clientID, 
    editTime: Date.now(), 
    docId: docId
  };
  queue.push(queue_data);
  let docUpdate = queueDict[docId]
  if (docUpdate) {
    if (queueDict[docId]["clientID"] != clientID) {
      clientID = "multi"
    }
    queueDict[docId] = {
      "clientID": clientID,
      "update": [...docUpdate["update"], array]
    }
  } else {
    queueDict[docId] = {
      "clientID": clientID,
      "update": [array]
    }
  }

  // queueDict[docId] = [...queueDict[docId], array]
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
