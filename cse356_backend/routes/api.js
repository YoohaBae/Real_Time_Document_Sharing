const express = require('express');
const yjs = require('yjs');

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
        yDocs[docId] = yDoc;
    }


    let data = yDoc.getText('test').toDelta();
    write(res, eventID, event, data);


    yDoc.on('update', update => {
        write(res, eventID, event, update);
    })

    function write(res, id, event, data) {
        res.write(`id: ${id}\n`);
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
})

router.post('/op/:id', (req, res) => {
    const docId = req.params.id.toString();
    const data = req.body.data;
    //let ydoc = persistence.getYDoc(id)
    let ydoc = yDocs[docId];
    let text = ydoc.getText('test');
    text.applyDelta(data);
    res.send("Successfully pushed event")
})


module.exports = router;