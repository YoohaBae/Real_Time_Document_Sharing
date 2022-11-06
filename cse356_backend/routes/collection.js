const express = require('express');
const Collection = require('../models/collection-model');
const router = express.Router();

async function saveCollection(name) {
    try {
        let now = Date.now()
        const newCollection = new Collection({name, now});
        return await newCollection.save();
    } catch {
        return null
    }
}

async function deleteCollection(id) {
    try {
        Collection.deleteOne({
            id: id
        }).then(function() {
            return true
        })
    } catch {
        return false
    }
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
            error:true,
            message: 'Database Error, Document creation unsuccessful',
        })
    }
    else {
        let id = collection.id;
        res.send({
            "id": id
        })
    }
})

router.post('/delete', async (req, res) => {
    let collectionId = req.body.id;
    let collection = await deleteCollection(collectionId);
    if (!collection) {
        res.send({
            error:true,
            message: 'Unable to delete collection',
        })
    }
    else {
        res.send()
    }
})

router.post('/list', async (req, res) => {
    let collections = await getRecentCollections();
    if (collections == null) {
        res.send({
            error:true,
            message: 'Unable to retrieve list of collections',
        })
    }
    else {
        res.send(collections)
    }
    res.send("Successfully listed document")
})

module.exports = router;