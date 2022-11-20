const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://198.199.80.28:9200'
})

module.exports = client;
