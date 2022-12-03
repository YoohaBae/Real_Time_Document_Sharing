const yjs = require('yjs');
const db = require('./db');
const Collection = require('./models/collection-model');
const Cursor = require('./models/cursor-model');
const queueDict = require('./queueDict');
let recentCursors = {};
const { MongodbPersistence } = require('y-mongodb');
const initialize = require('./rabbitmq');
const persistence = new MongodbPersistence('mongodb://209.151.154.219:27017/Milestone', 'yDocs');
const { EventEmitter } = require("node:events");


const emitter = new EventEmitter()
emitter.setMaxListeners(100)

let connection, channel;
initialize().then(async ([conn, chan]) => {
  connection = conn;
  channel = chan;
  runUpdateConsumer();
  runCursorConsumer();
  run();
})

const jsonToUint8Array = (object) => {
  let ret = null;
  ret = new Uint8Array(Object.keys(object).length);
  for (let key in object) {
    // @ts-ignore
    ret[key] = object[key];
  }
  return ret;
};

async function runUpdateConsumer() {
    await channel.assertQueue("updates");
    channel.consume("updates", async (message) => {
      const output = JSON.parse(message.content.toString());
      channel.ack(message);
      let {update, clientID, editTime, docId} = output;
      let docUpdate = queueDict[docId];
      let array = jsonToUint8Array(update);
      if (docUpdate) {
        if (queueDict[docId]["clientID"] != clientID) {
          clientID = "multi"
        }
        queueDict[docId] = {
          "clientID": clientID,
          "update": [...docUpdate["update"], array],
          "editTime": editTime
        }
      } else {
        queueDict[docId] = {
          "clientID": clientID,
          "update": [array],
          "editTime": editTime
        }
      }
    })
}


async function runCursorConsumer() {
    await channel.assertQueue("cursors");
    channel.consume("cursors", (message) => {
      const output = JSON.parse(message.content.toString());
      channel.ack(message);
      let {docId, index, length, session_id, name} = output;
      if (!(docId in recentCursors)) {
        recentCursors[docId] = {}
      }
      recentCursors[docId][session_id] = {
        index, length, name
      }
    })
}

function updateDocuments() {
  for (let docId in queueDict) {
    let updates = queueDict[docId]["update"];
    let clientID = queueDict[docId]["clientID"];
    let editTime = queueDict[docId]["editTime"];
    let update = null;
    if (updates.length > 1) {
      update = yjs.mergeUpdates(updates);
    }
    else {
      update = updates[0];
    }
    delete queueDict[docId];
    updateQueueData = {
      update, clientID, docId
    }
    channel.sendToQueue('event-updates', Buffer.from(JSON.stringify(updateQueueData)));
    let filter = {id: docId};
    persistence.storeUpdate(docId, update).then((res) => {
      Collection.findOneAndUpdate(filter, editTime);
      channel.sendToQueue('elastic', Buffer.from(JSON.stringify({"docId":docId})))
    })
  }
}

function updateCursors() {
  for (let docId in recentCursors) {
    for (let session_id in recentCursors[docId]) {
      let cursor = recentCursors[docId][session_id]
      let name = cursor.name;
      let index = cursor.index;
      let length = cursor.length;
      cursorQueueData = {
        docId,
        session_id,
        "name": name,
        "index": index,
        "length": length
      }
      channel.sendToQueue('event-cursors', Buffer.from(JSON.stringify(cursorQueueData)));
      delete recentCursors[docId][session_id];
      let filter = {docId: docId, session_id: session_id};
      if (index == -1) {
        Cursor.findOneAndDelete(filter);
      }
      else {
        Cursor.findOneAndUpdate(filter, {name, length, index});
      }
    }
    delete recentCursors[docId];
  }
}

function run() {
  setInterval(updateDocuments, 3000);
  setInterval(updateCursors, 3000);
}