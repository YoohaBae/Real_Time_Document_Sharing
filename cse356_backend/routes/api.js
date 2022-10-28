const express = require('express');
const yjs = require('yjs');;

const {LeveldbPersistence} = require('y-leveldb');
const router = express.Router();

const yDocs = {}
//const persistence = new LeveldbPersistence('./db-storage')


router.get('/connect/:id', async (req, res) => {
    const id = req.params.id.toString();
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Connection', 'keep-alive'
    });
    let yDoc = null;
    let event = "sync";
    if (yDocs[id] !== undefined) {
        yDoc = yDocs[id];
    } else {
        yDoc = new yjs.Doc();
    }


    let data = yDoc.getText('test').toDelta();
    write(event, data);


    yDoc.on('update', update => {
        res.write(update);
    })


    function write(event, data) {
        let message = {
            "event": event,
            "data": data
        }
        res.write(JSON.stringify(message));
    }
})

router.post('/op/:id', (req, res) => {
    const id = req.params.id.toString();
    const data = req.body.data;
    //let ydoc = persistence.getYDoc(id)
    let ydoc = yDocs[id];
    let text = ydoc.getText('test');
    text.applyDelta(data);
    res.send("Successfully pushed event")
})


module.exports = router;