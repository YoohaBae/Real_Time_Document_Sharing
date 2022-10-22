const express = require('express'), router = express.Router();

router.get('/connect/', (req, res) => {
    const id = req.params.id;
    const event = req.body.event;
    const data = req.body.data;
    res.send("Hello Connection")
})

router.post('/op/', async (req, res) => {
    res.send("Hello OP")
})


module.exports = router;