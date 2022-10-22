const express = require('express'), router = express.Router();

router.get('/connect/', (req, res) => {
    res.send("Hello Connection")
})

router.post('/op/', async (req, res) => {
    res.send("Hello OP")
})


module.exports = router;