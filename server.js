var connect = require('connect')
var io = require('socket.io')
var _bs = require('browser-stream')
var browserify = require('browserify')
var crdt = require('crdt')
var doc = new crdt.Doc()

var app = connect()
      .use(connect.static(__dirname+'/static'))
      .use(browserify(__dirname+'/client.js'))

io = io.listen(app.listen(3000))

io.sockets.on('connection', function (sock) {
  var bs = _bs(sock)
  bs.on('connection', function (stream) {

    stream.pipe(crdt.createStream(doc)).pipe(stream)

  })
})
