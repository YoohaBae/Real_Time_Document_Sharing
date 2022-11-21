const elasticClient = require("./elasticsearch");
const yjs = require('yjs');

const yDocs = require("./ydocs");
const queue = require("./queue");
const Collection = require('./models/collection-model');
const queueDict = require("./queueDict")

// const jsonToUint8Array = (object) => {
//     let ret = null;
//     ret = new Uint8Array(Object.keys(object).length);
//     for (let key in object) {
//       // @ts-ignore
//       ret[key] = object[key];
//     }
//     return ret;
//   };

function updateElastic(docId) {
    let content = yDocs[docId].getText('test2').toString();
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
    }
    catch (err){
        console.log(err);
    }
}


function updateDocuments() {
    while (queue.length !=0) {
        let data = queue.shift();
        // let update = data["update"];
        // let clientID = data["clientID"];
        let time = data["editTime"];
        let docId = data["docId"];
        if (!(docId in queueDict)) {
            continue;
        }
        // let array = jsonToUint8Array(update);
        let updates = queueDict[docId]["update"]
        let clientID = queueDict[docId]["clientID"]
        let ydoc = yDocs[docId];
        let update = null;
        if (updates.length > 1) {
            update = yjs.mergeUpdates(updates);
        }
        else {
            update = updates[0];
        }
        //let ydoc = persistence.getYDoc(id)
        yjs.applyUpdate(ydoc, update, clientID);
        delete queueDict[docId];
        //yjs.logUpdate(array);
        yDocs[docId] = ydoc;
        updateElastic(docId);
        let filter = { id: docId };
        Collection.findOneAndUpdate(filter, time);
    }
}

function run() {
    setInterval(updateDocuments, 300);
}


module.exports = run;