const express = require('express');
const yjs = require('yjs');
const toUint8Array = require('base64-to-uint8array')
const {LeveldbPersistence} = require('y-leveldb');
const router = express.Router();

const yDocs = {}
//const persistence = new LeveldbPersistence('./db-storage')

function write(res, id, event, data) {
    res.write(`id: ${id}\n`);
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.get('/connect/:id', async (req, res) => {
    const docId = req.params.id.toString();
    let eventID = 0;
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    let yDoc = null;
    let event = "sync";
    if (yDocs[docId] !== undefined) {
        yDoc = yDocs[docId];
    } else {
        yDoc = new yjs.Doc();
        yDocs[docId] = yDoc;
    }

    let data = yDoc.getText(docId).toDelta();
    write(res, eventID, event, data);
    eventID++;

    yDoc.on('update', update => {
        let event = "update";
        console.log("update!!")
        console.log(update)
        write(res, eventID, event, update);
        eventID++;
    })
})

router.post('/op/:id', async (req, res) => {
    const docId = req.params.id.toString();
    const clientID = req.body.clientID;
    const update = req.body.update;
    let array = toUint8Array(update);
    let ydoc = yDocs[docId];
    console.log("operation");
    console.log(array);
    //let ydoc = persistence.getYDoc(id)
    yjs.applyUpdate(ydoc, array);
    yDocs[docId] = ydoc;
    res.send("Successfully pushed event")
})


module.exports = router;