const yjs = require('yjs');
const db = require('./db');
const Collection = require('./models/collection-model');
const queueDict = require('./queueDict');
const { MongodbPersistence } = require('y-mongodb');
const initialize = require('./rabbitmq');
const persistence = new MongodbPersistence('mongodb://localhost:27017/Milestone', 'yDocs');

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
      const input = JSON.parse(message.content.toString());
      channel.ack(message);
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
    updateQueueData = {
      update, clientID, docId
    }
    channel.sendToQueue('event-updates', Buffer.from(JSON.stringify(updateQueueData)));
      delete queueDict[docId];
    let filter = {id: docId};
    persistence.storeUpdate(docId, update).then((res) => {
      Collection.findOneAndUpdate(filter, editTime);
    })
  }
}

function run() {
  console.log("running")
  setInterval(updateDocuments, 500);
}