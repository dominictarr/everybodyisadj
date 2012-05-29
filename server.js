var connect = require('connect')
var io = require('socket.io')
var _bs = require('browser-stream')
var browserify = require('browserify')
var crdt = require('crdt')
var users = {}

var fs = require('fs')
var es = require('event-stream')
var rpc = require('rpc-stream')

var watch = require('watch')

var store = require('./crdt-session-store')()
var users = store.doc

var kv = require('kv')(__dirname + '/data')
var sync2 = require('./sync')(kv)

sync2(users, 'users')

var docs = {}

var expose = {
  search: function (query, callback) {
    //todo filter by query...
    var f = []
    kv.list().forEach(function (item) {
      var m = /^([^:]+\:.+)_1$/.exec(item)
      if(!m) return
      m = m[1]
      if(~m.indexOf(query)) //todo: smarter way to handle query
        f.push(m)
    })
    callback(null, f)
  }
}

function loadDoc(key, init) {
  if(docs[key])
    return docs[key]
  else
  var doc = docs[key] = new crdt.Doc()
  process.nextTick(function () {
    sync2(doc, key)
  })
  //or better, for the db to emit 'sync' event?
  return doc
}
var index = fs.readFileSync(__dirname+'/static/index.html')

//var store = new connect.session.MemoryStore()
var app = connect()
  .use(connect.cookieParser('whatever'))
  .use(connect.session({
    secret: 'whatever', 
    store: store, 
    cookie: {maxAge: 86400}
  })) //how to make the cookie last forever?
  .use(function (req, res, next) {
    if(req.url != '/globals.js') return next()
    res.end(';var GLOBALS = ' + JSON.stringify({
      user_id: req.sessionID
    }) + ';\n')
  })
  .use(connect.static(__dirname+'/static'))
  .use(browserify(__dirname+'/client.js'))
  .use(function (req, res, next) {
    console.log('URL', JSON.stringify(req.url))
    if(/^\/\w+\/\w+\/?$/.test(req.url))
      res.end(index)
    else
      next() //this will mean an error...
  })

io = io.listen(app.listen(process.env.PORT || 3000))

var parseCookie = require('connect').utils.parseCookie;

/*
session stuff, unfortunately socket.io doesn't do much handholding here.
probably gotta wrap all this up in one thing that makes streams over socket.io easy.
with cookies for sessions.
*/

io.configure(function (){
  io.set('authorization', function (handshake, cb) {
    if(handshake.headers.cookie) {
      handshake.cookie = parseCookie(handshake.headers.cookie)
      // note that you will need to use the same key to grad the
      // session id, as you specified in the Express setup.
      var sid = handshake.cookie['connect.sid']
      handshake.sessionID = sid.split('.').shift() //WHY DOES SOCKET>IO append something after the .?
      var user = users.get(handshake.sessionID)
      handshake.user = user
      cb(null, true)
    }
    handshake.thing = Math.random()
  })
})

function streamRouter(io) {
  var routes = []
  io.sockets.on('connection', function (sock) {
    var bs = _bs(sock)
    bs.on('connection', function (stream) {
      for (var i in routes) {
        var r = routes[i]
        var type = typeof r.matcher
        if( type == 'function' ? r.matcher(stream, sock.handshake)
          : type == 'string'   ? r.matcher == stream.name
          :                      r.matcher.test(stream.name) )
          return r.action(stream, sock.handshake)}
    })
  })
  function add(matcher, createStream) {
    routes.push({matcher: matcher, action: createStream})
    return add
  }
  add.add = add
  add.routes = routes
  return add
}

var djnames = 'desklamp,no-requests,shoestring,whatever,noname'.split(',')
function randName() {
  return djnames[~~(djnames.length * Math.random())]
}

var rpcStreams = []

function group(stream) {
  rpcStreams.push(stream)
  stream.on('end', function () {
    rpcStreams.splice(rpcStreams.indexOf(stream), 1)
  })
  return stream
}

group.all = function (method, args) {
  rpcStreams.forEach(function (s) {
    s.rpc(method, args)
  })
}

fs.watch(__dirname+'/static', {}, function (event, cur) {
  console.log("WATCH", event, cur)
  index = fs.readFileSync(__dirname+'/static/index.html')
  group.all('reload', [])
})

/*
  move this into browser-stream?

  decouple this from browser stream, to fit TCP also.
*/
/*
  these are not separate connections.
  these are fake streams multiplexed over a single socket.io connection.
*/
streamRouter(io)
  .add('proto', function (stream) {
    //passin the playlist this is with respect to
    var host = stream.options.host
    var party = stream.options.party
    var doc = loadDoc(host +':'+ party)
    doc.once('sync', function (id) {
      if(doc.id !== this.id) return
      var loc = doc.get('party')
      if(!loc.get('party'))
        loc.set({host: host, party: party}) 
    })
    stream.pipe(crdt.createStream(doc)).pipe(stream)
  })
  .add(/^chat:/, function (stream) {
     stream.pipe(crdt.createStream(loadDoc(stream.name))).pipe(stream)   
  })
  .add('whoami', function (stream, handshake) {
    /*
      oh, damn. the client needs to know which user it is.
      so it's gotta get that in some particular way...
      hmm, I think what I'll do is a script tag...
    */
    if(!handshake.user.get('name'))
      handshake.user.set({name:  'DJ ' + randName()})
    stream.pipe(crdt.createStream(users)).pipe(stream) 
  })
  .add('rpc', function (stream) {
    stream.pipe(group(rpc(expose, true))).pipe(stream)
  })
  /*
    socket.io already supports RPG like I want, but i want to do it across streams,
    so I'm not coupled to socket.io
    really, socket.io would be better to just expose a single stream interface
    and then I could multiplex over that... or just use sockjs.
  */
