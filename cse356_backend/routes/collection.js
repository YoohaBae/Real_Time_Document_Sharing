const express = require('express');
const elasticClient = require("../elasticsearch")
const Collection = require('../models/collection-model');
const User = require("../models/user-model");
const router = express.Router();

const auth = async (req, res, next) => {
    const key = req.cookies.key;
    if (!key) {
        res.send({
            error: true,
            message: 'User is not authenticated',
        });
    } else {
        try {
            const user = await User.findOne({key});
            if (!user) {
                res.send({
                    error: true,
                    message: 'User is not authenticated',
                });
            } else {
                next();
            }
        } catch {
            res.send({
                error: true,
                message: 'User is not authenticated',
            });
        }
    }
};

router.use(auth);

async function saveCollection(name) {
    try {
        let now = Date.now()
        const newCollection = new Collection({"name": name, "editTime": now});
        return await newCollection.save();
    } catch (err) {
        return null
    }
}

async function deleteCollection(id) {
    return await Collection.deleteOne({
        id: id.toString()
    }).then(function () {
        return true;
    }).catch((err) => {
        console.log(err);
        return false;
    });
}

async function getRecentCollections() {
    try {
        return await Collection.find({}, 'id name').sort({editTime: -1}).limit(10)
    } catch {
        return null
    }
}

router.post('/create', async (req, res) => {
    let collectionName = req.body.name;
    let collection = await saveCollection(collectionName);
    if (collection == null) {
        res.send({
            error: true,
            message: 'Database Error, Document creation unsuccessful',
        })
    } else {
        let id = collection.id;
        await elasticClient.index({
            index: 'docs',
            id: id,
            document: {
                name: collectionName,
                content: ""
            }
        }).then(r => {
            res.send({
                "id": id
            })
        })

    }
})

router.post('/delete', async (req, res) => {
    let collectionId = req.body.id;
    let collection = await deleteCollection(collectionId);
    if (!collection) {
        res.send({
            error: true,
            message: 'Unable to delete collection',
        })
    } else {
        let id = collectionId;
        await elasticClient.delete({
            index: 'docs',
            id: id
        }).then(r => {
            res.json({})
        }).catch(err => {
            console.log(err)
            res.json({})
        })
    }
})

router.get('/list', async (req, res) => {
    let collections = await getRecentCollections();
    if (collections == null) {
        res.send({
            error: true,
            message: 'Unable to retrieve list of collections',
        })
    } else {
        res.send(collections)
    }
})

module.exports = router;