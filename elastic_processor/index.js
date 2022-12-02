const yjs = require('yjs');
const db = require('./db');
let set = new Set();
const { MongodbPersistence } = require('y-mongodb');
const initialize = require('./rabbitmq');
const persistence = new MongodbPersistence('mongodb://209.151.154.219:27017/Milestone', 'yDocs');
const elasticClient = require("./elasticsearch")

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
    let docId = output;
    set.add(docId);
  })
}



function updateIndex() {
  for (let docId in set) {
    persistence.getYDoc(docId).then((yDoc)=> {
      let content = yDoc.getText('test2').toString();
      try {
        elasticClient.index({
            index: 'docs',
            id: docId,
            refresh: true,
            document: {
                content: content,
                suggest: {
                    input: content.split(/[\r\n\s]+/)
                }
            },
        })
      } catch (err){
          console.log(err);
      }
    })
    set.delete(docId);
  }
}


function run() {
  setInterval(updateIndex, 5000);
}