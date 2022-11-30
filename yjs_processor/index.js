const yjs = require('yjs');
const db = require('./db');
const Collection = require('./models/collection-model');
// const queueDict = require('./queueDict');
const { MongodbPersistence } = require('y-mongodb');
const initialize = require('./rabbitmq');
const persistence = new MongodbPersistence('mongodb://localhost:27017/Milestone', 'yDocs');

let connection, channel;
initialize().then(async ([conn, chan]) => {
  connection = conn;
  channel = chan;
  console.log("initialized channel and connection");
  runUpdateConsumer();
  runCursorConsumer();
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
      console.log("processer has data");
      let {update, clientID, editTime, docId} = output;
      updateQueueData = {
          update, clientID, docId
      }
      channel.sendToQueue('event-updates', Buffer.from(JSON.stringify(updateQueueData)));
      let filter = {id: docId};
      let array = jsonToUint8Array(update);
      persistence.storeUpdate(docId, array).then((res) => {
        console.log(res);
        Collection.findOneAndUpdate(filter, editTime);
      })

    })
}


async function runCursorConsumer() {
    await channel.assertQueue("cursors");
    channel.consume("cursors", (message) => {
      const input = JSON.parse(message.content.toString());
      channel.ack(message);
    })
}
