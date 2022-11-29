const Memcached = require('memcached')
const memcached = new Memcached(
    'localhost:11211')

module.exports = memcached;
