const { LeveldbPersistence } = require('y-leveldb');
const yjs = require('yjs');
const db = require('./db');
const Collection = require('./models/collection-model');
const queueDict = require('./queueDict');
const initialize = require('./rabbitmq');

let connection, channel;
initialize().then(async ([conn, chan]) => {
  connection = conn;
  channel = chan;
  console.log("initialized channel and connection");
  runUpdateConsumer();
  runCursorConsumer();
})

async function runUpdateConsumer() {
    await channel.assertQueue("update");
    channel.consume("update", (message) => {
      const input = JSON.parse(message.content.toString());
      console.log(input);
      channel.ack(message);
    })
}


async function runCursorConsumer() {
    await channel.assertQueue("cursor");
    channel.consume("cursor", (message) => {
      const input = JSON.parse(message.content.toString());
      console.log(input);
      channel.ack(message);
    })
}
