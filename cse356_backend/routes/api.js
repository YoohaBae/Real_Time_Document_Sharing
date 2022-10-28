const express = require('express');
const yjs = require('yjs');;
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

    function write() {
        res.write('data: ' + i + '\n\n');
    }
})

router.post('/op/:id', (req, res) => {
    const id = req.params.id.toString();
    const message = req.body;
    let ydoc = persistence.getYDoc(id)
    let text = ydoc.getText('test')
    res.send("Successfully pushed event")
})


module.exports = router;