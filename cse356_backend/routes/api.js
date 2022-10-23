const express = require('express');
const yjs = require('yjs')
const {LeveldbPersistence} = require('y-leveldb');
const {WebSocketServer} = require("ws");
const router = express.Router();

const events = []
const persistence = new LeveldbPersistence('./db-storage')


const wss = new WebSocketServer({
    port: 8000,
    path: "/api/connect/"
})

wss.on('connection', async function connection(ws) {
    console.log(ws.req.url);
    const id = ws.req.params.id.toString();

    const allDocs = await persistence.getAllDocNames();
    if (allDocs.includes(id)) {
        let html = yDoc.get('html', yjs.Text)
        let message = {
            "event": "sync",
            "data": html
        }
        ws.send(message);
    } else {
        const yDoc = yjs.Doc();
    }
    ws.on('message', function message(data) {
        console.log('recieved %s', data);
        if (data["id"] === id) {
            //update wdoc with json data
            console.log(data);
            console.log(id);
        }
    })
})


router.post('/op/', async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    let event = {
        "id": id,
        "body": body
    }
    events.push(event)
    res.send("Successfully pushed event")
})


module.exports = router;