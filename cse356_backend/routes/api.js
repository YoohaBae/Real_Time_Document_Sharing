const express = require('express');
const yjs = require('yjs');
const {LeveldbPersistence} = require('y-leveldb');
const router = express.Router();

const yDocs = {}
//const persistence = new LeveldbPersistence('./db-storage')


router.get('/connect/:id', async (req, res) => {
    const id = req.params.id.toString();
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    });
    let yDoc = null;
    let event = "sync";
    if (yDocs[id] !== undefined) {
        yDoc = yDocs[id];
    } else {
        yDoc = new yjs.Doc();
    }
    let data = yDoc.getText('test');
    write(event, data);



    function write(event, data) {
        res.write({
            "event": event,
            "data": data.toDelta()
        });
    }
})

router.post('/op/:id', (req, res) => {
    const id = req.params.id.toString();
    const body = req.body;
    let operation = body["operation"];
    let index = body["index"];
    let content = body["content"];
    let format = body["format"];
    //let ydoc = persistence.getYDoc(id)
    let ydoc = yDocs[id];
    let text = ydoc.getText('test');
    if (operation === "insert") {
        text.insert(parseInt(index), content, format);
    } else if (operation === "delete") {
        text.delete(parseInt(index), parseInt(content));
    }
    res.send("Successfully pushed event")
})


module.exports = router;