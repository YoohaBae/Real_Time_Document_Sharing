const express = require('express');
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
        // highlight: {
        //     fields: {
        //         name: {
        //             order: 'score',
        //             fragment_offset: 5
        //         },
        //         content: {
        //             order: 'score',
        //             fragment_offset: 5
        //         }
        //     }
        // },
        highlight: {
            type: "unified",
            number_of_fragments: 3,
            fields: {
                content: {

                }
            }
        },
        size: 10,
        fields: ["name", "content"]
    })
    res.json(result);
})

router.get("/suggest", async (req, res) => {
    let query = req.params.q;
    console.log(query);
    res.send("suggest")
})

module.exports = router;