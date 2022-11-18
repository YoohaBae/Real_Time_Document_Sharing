const express = require('express');
const { keyEncoding } = require('y-leveldb');
const router = express.Router();
const elasticClient = require("../elasticsearch")

router.get("/search", async (req, res) => {
    let query = req.query.q;
    console.log(query);
    if (!query) {
        res.send({
            "error": true,
            "message": "No query value"
        })
    }
    const result = await elasticClient.search({
        index: 'docs',
        query: {
            multi_match: {
                query: query,
                fields: ["name", "content"]
            }
        },
        highlight: {
            fields: {
                name: {
                    order: 'score',
                    fragment_size: 150
                },
                content: {
                    order: 'score',
                    fragment_size: 150
                }
            }
        },
        size: 10,
        fields: ["name", "content"],
    })
    res.json(result);
})

router.get("/suggest", async (req, res) => {
    let query = req.query.q;
    const result = await elasticClient.search({
        query: {
            prefix: {
                "content.keyword": query
            }
        }
    });
    console.log(result)
    res.send(result)
})

module.exports = router;