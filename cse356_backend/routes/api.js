const express = require('express');
const yjs = require('yjs')
const {LeveldbPersistence} = require('y-leveldb');
const {WebSocketServer} = require("ws");
const router = express.Router();

const webSockets = {}
const persistence = new LeveldbPersistence('./db-storage')


router.get('/connect/:id', (req, res) => {
    const id = req.params.id.toString();
    console.log(id)
    let wss = null;
    if (id in webSockets) {
        wss = webSockets[id]["obj"];
    } else {
        wss = new WebSocketServer({noServer: true});
        webSockets[id] = {
            "obj": wss,
            "events": []
        };
        console.log(webSockets)
    }
    wss.on('connection', async function connection(ws) {
        console.log(ws);
        while (true) {
            if (webSockets[id]["events"].length > 0) {
                console.log("here222")
                let event = webSockets[id]["events"].shift();
                ws.send(event)
            }

            ws.on('message', function message(data) {
                console.log('recieved %s', data);
                if (data["id"] === id) {
                    //update wdoc with json data
                    console.log(data);
                    console.log(id);
                }
            })
        }
        //const id = ws.req.params.id.toString();

        // const allDocs = await persistence.getAllDocNames();
        // if (allDocs.includes(id)) {
        //     let html = yDoc.get('html', yjs.Text)
        //     let message = {
        //         "event": "sync",
        //         "data": html
        //     }
        //     ws.send(message);
        // } else {
        //     const yDoc = yjs.Doc();
        // }
    })
})

router.post('/op/', async (req, res) => {
    const id = req.body.id.toString();
    const message = req.body.message;
    let event = {
        "id": id,
        "body": message
    }
    webSockets[id]["events"].push(event)
    res.send("Successfully pushed event")
})


module.exports = router;