const yjs = require('yjs');
const db = require('./db');
let set = new Set();
const { MongodbPersistence } = require('y-mongodb');
const initialize = require('./rabbitmq');
const persistence = new MongodbPersistence('mongodb://209.151.154.219:27017/Milestone', 'yDocs');
const elasticClient = require("./elasticsearch")
const { EventEmitter } = require("node:events");


const emitter = new EventEmitter()
emitter.setMaxListeners(100)

let connection, channel;
initialize().then(async ([conn, chan]) => {
  connection = conn;
  channel = chan;
  runElasticConsumer();
  run();
})

async function runElasticConsumer() {
  await channel.assertQueue("elastic");
  channel.consume("elastic", async (message) => {
    const output = JSON.parse(message.content.toString());
    channel.ack(message);
    let docId = output["docId"];
    set.add(docId);
  })
}



async function updateIndex() {
  const op = []
  for (let docId of set) {
    let yDoc = await persistence.getYDoc(docId)
    let content = yDoc.getText('test2').toString();
    const doc = {
    id: docId,
    content: content,
    suggest: {
        input: content.split(/[\r\n\s]+/)
    }
  }
    op.push(doc)
    set.delete(docId);
  }
  const operations = op.flatMap(doc => [{index: {_index: "docs", _id: doc.id}}, doc])
  if (operations.length > 0) elasticClient.bulk({refresh: true, operations})
  // const document = await elasticClient.search({index: "docs", 
  // query: {
  //   "match_all": {}
  // }})
  // console.log(document.hits.hits[0]._source)
}


function run() {
  setInterval(updateIndex, 5000);
}
