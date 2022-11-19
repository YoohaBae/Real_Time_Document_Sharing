const express = require('express');
const { keyEncoding } = require('y-leveldb');
const router = express.Router();
const elasticClient = require("../elasticsearch");
const User = require('../models/user-model');
const yDocs = require("../ydocs");
const updatedDocIds = require("../updatedDocIds");

const auth = async (req, res, next) => {
    const key = req.cookies.key;
    if (!key) {
      res.send({
        error: true,
        message: 'User is not authenticated',
      });
    } else {
      try {
        const user = await User.findOne({ key });
        if (!user) {
        //   console.log("user not found")
          res.send({
            error: true,
            message: 'User is not authenticated',
          });
        } else {
          next();
        }
      } catch (err){
        console.log(err)
        res.send({
          error: true,
          message: 'User is not authenticated',
        });
      }
    }
  };
  
  router.use(auth);

async function updateDocuments() {
    updatedDocIds.forEach(async docId => {
        let ydoc = yDocs[docId];
        let content = ydoc.getText('test2').toString();
        await elasticClient.update({
            index: 'docs',
            id: docId,
            doc: {
                content: content,
                suggest: {
                    input: content.split('/[\n\s+]')
                }
            },
        })
        updatedDocIds.delete(docId);
    })
}

router.get("/search", async (req, res) => {
    let query = req.query.q;
    // console.log(query);
    if (!query) {
        res.send({
            "error": true,
            "message": "No query value"
        })
    }
    await updateDocuments();
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
    await updateDocuments();
    // console.log(result)
    res.send(result)
})

module.exports = router;