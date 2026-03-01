const heapdump = require('heapdump');

heapdump.writeSnapshot('/tmp/' + Date.now() + '.heapsnapshot');
console.log('Heap snapshot created'); 