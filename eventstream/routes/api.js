const express = require('express');
const initialize = require('../rabbitmq');
const Cursor = require('../models/cursor-model');
const { MongodbPersistence } = require('y-mongodb');
const yjs = require('yjs');
const persistence = new MongodbPersistence('mongodb://209.151.154.219:27017/Milestone', 'yDocs');
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

  // get all current cursors
  let filter = {
    "docId": docId
  }
  let cursors = await Cursor.find(filter);
  if (cursors != []) {
    for (let cursorID in cursors) {
      let presenceEvent = 'presence';
      let cursor = cursors[cursorID];
      let message = {
          session_id: cursor.session_id,
          name: cursor.name,
          cursor: {
              index: cursor.index,
              length: cursor.length,
          },
      };
      write(res, eventID, presenceEvent, message);
      eventID++;
    }
  }
 
    
  req.on('close', async () => {
    let name = req.cookies.name;
    let session_id = req.cookies.id;
    let index = -1;
    let length = 0
    const cursorQueueData = {
      docId,
      index,
      length,
      session_id,
      name
    };
    queue = 'cursors'
    await channel.assertQueue(queue, {durable:true});
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(cursorQueueData)), {
      persistent: true
    });
  });
});

let eventID = 10000;

async function runEventUpdateConsumer() {
  channel.assertExchange('event-updates', 'fanout', {
    durable: true
  });
  await channel.assertQueue('', {
    exclusive: true
  });
  if (error) {
    throw error;
  }
  channel.bindQueue(q.queue, "event-updates", '');
  channel.consume(q.queue, (message) => {
    const output = JSON.parse(message.content.toString());
    console.log(process.pid);
    console.log(output);
    channel.ack(message);
    let {update, clientID, docId} = output;
    if ((docId in clients)) {
      for (let i=0; i < clients[docId].length; i++) {
        let client = clients[docId][i];
        let updateEvent = "update";
        // console.log(clientID);
        let data = {
          update, clientID
        }
        write(client["res"], eventID, updateEvent, data);
      }
      eventID++;
    }
  })
};

async function runEventCursorConsumer() {
  await channel.assertQueue("event-cursors");
  channel.consume("event-cursors", (message) => {
    const output = JSON.parse(message.content.toString());
    console.log(process.pid);
    console.log(output);
    channel.ack(message);
    let {docId, session_id, name, index, length} = output;
    if ((docId in clients)) {
      for (let i=0; i < clients[docId].length; i++) {
        let client = clients[docId][i];
        let presenceEvent = 'presence';
        let message = null;
        if (index == -1) {
          message = {
            session_id,
            name,
            cursor: {},
          };
        }
        else {
          message = {
            session_id, 
            name,
            cursor: { index, length }
          };
        }
        write(client["res"], eventID, presenceEvent, message);
      }
      eventID++;
    }
  })
}
module.exports = router;
