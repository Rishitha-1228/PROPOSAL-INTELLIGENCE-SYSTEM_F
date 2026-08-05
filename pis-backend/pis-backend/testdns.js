const dns = require('dns');

dns.resolveSrv(
  '_mongodb._tcp.cluster0.4fssllx.mongodb.net',
  (err, addresses) => {
    console.log('ERROR:', err);
    console.log('ADDRESSES:', addresses);
  }
);