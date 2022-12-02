const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://209.151.151.187:9200'
})

module.exports = client;
