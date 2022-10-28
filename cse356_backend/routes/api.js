const express = require('express');
const yjs = require('yjs');
const toUint8Array = require('base64-to-uint8array')
const {LeveldbPersistence} = require('y-leveldb');
const router = express.Router();

const yDocs = {}
//const persistence = new LeveldbPersistence('./db-storage')


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
        console.log("old doc")
    } else {
        yDoc = new yjs.Doc();
        console.log("new doc")
    }


    let data = yDoc.getText(docId).toDelta();
    write(res, eventID, event, data);

    yDoc.on('update', update => {
        let event = "update";
        write(res, eventID, event, update);
    })

    yDocs[docId] = yDoc;
    function write(res, id, event, data) {
        res.write(`id: ${id}\n`);
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
})

router.post('/op/:id', async (req, res) => {
    const docId = req.params.id.toString();
    const clientID = req.body.clientID;
    const update = req.body.update;
    let array = toUint8Array(update);
    let ydoc = yDocs[docId]
    console.log("operation");
    //let ydoc = persistence.getYDoc(id)
    yjs.applyUpdate(ydoc, array);
    res.send("Successfully pushed event")
})


module.exports = router;