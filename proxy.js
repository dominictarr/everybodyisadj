var net = require('net')

net.createServer(function (con) {
  var inner = net.connect
    (3000) 
    //(80, 'everybodyisadj.koha.as')
  console.error(con.address(), con.remoteAddress, con.remotePort)
  con.pipe(process.stdout, {end: false})
  con.pipe(inner).pipe(con)
}).listen(3001, '127.0.0.1')
