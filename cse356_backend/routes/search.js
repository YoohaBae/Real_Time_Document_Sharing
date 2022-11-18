const express = require('express');
const router = express.Router();
const elasticClient = require("../elasticsearch")

router.get("/search", async (req, res) => {
    let query = req.params.q;
    const result = await elasticClient.search({
        index: 'doc',
        query: {
            match: {
                name: query,
                content: query
            }
        }
    })
    console.log(result);
    res.send("search")
})

router.get("/suggest", async (req, res) => {
    let query = req.params.q;
    console.log(query);
    res.send("suggest")
})