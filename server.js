var connect = require('connect')
var io = require('socket.io')
var _bs = require('browser-stream')
var browserify = require('browserify')
var crdt = require('crdt')
var users = {}

var fs = require('fs')
var es = require('event-stream')

var store = require('./crdt-session-store')()
var users = store.doc

/*
  okay,

  more backends for saving docs.

  replicate user data to 

  check if the file exists,
  read the file,
  on end,
  start updating the file.

  extra-points:
    start writing two files,
    every N writes,
    start writing one of the files again.
    that will keep the file compact
    and give good durability.  
*/

var kv = require('kv')(__dirname + '/data')

/*
  what about a sync stream method that returned a RW stream
  that read from the database and then wrote to it...
*/

function sync(doc, key) {
  kv.has(key, function (err) {
    function write () {
      crdt.createStream(doc)
        .pipe(kv.put(key))
    }
    //don't read if file does not exist
    if(err) return write()

    kv.get(key)
      .pipe(crdt.createStream(doc))
      .on('end', write)
  })
}
/*
  syncronize a document,
  but periodically startover to keep the file
  from growing too large with redundant updates.
  (can't help if there are too many creates though)

  this means that doc should emit when there is a create
  and when there is an update.

  since the files are rotated, you cant loose data.
  (maybe there are some crazy edge case where you can)
  but you wont loose (old) data from an occasional crash.
  can loose data that is not written yet.

  TODO doc emits update/create counter.
  fix this when write perf is important
*/
function sync2(doc, key, timer) {
  var turn, both, cs
  timer = timer || 10e3

  function read(key, ready) {
    kv.has(key, function (err) {
      if(err) return ready(err)
      var ds = crdt.createStream(doc)
      kv.get(key).on('end', ready).pipe(ds)
    })
  }
  function write(key) {
    var source = crdt.createStream(doc)
    source.pipe(kv.put(key))
    return source
  }
  function start() {
    if(!both) return both = true
    //doc emits 'sync', id .
    //in this case, we have loaded the doc's state from
    //disk, that is like syncing with your self. 
    doc.emit('sync', doc.id) 
    next()
    setInterval(next, 10e3)
  }

  function next() {
    turn = !turn
    if(cs) cs.end()
    cs = write(key + '_' + (turn ? 1 : 2))
  }

  read(key + '_1', start)
  read(key + '_2', start)
}

//sync2(doc, 'playlist1')
sync2(users, 'users')

var docs = {}

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

//var store = new connect.session.MemoryStore()
 
var app = connect()
  .use(connect.cookieParser('whatever'))
  .use(connect.session({secret: 'whatever', store: store, cookie: {maxAge: 86400}})) //how to make the cookie last forever?
  .use(function (req, res, next) {
    if(req.url != '/globals.js') return next()
    res.end(';var GLOBALS = ' + JSON.stringify({
      user_id: req.sessionID
    }) + ';\n')
  })
  .use(connect.static(__dirname+'/static'))
  .use(browserify(__dirname+'/client.js'))

io = io.listen(app.listen(3000))

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

streamRouter(io)
  .add(/^pl:\w+/, function (stream) {
    //if the playlist is not in memory
    //load, or create it.
    //if there are no users for a given pl,
    //dispose of it.
  })
  .add('proto', function (stream) {
    //passin the playlist this is with respect to
    var host = stream.options.host   || 'everybody'
    var party = stream.options.party || 'playlist1'
    var doc = loadDoc(host +':'+ party)
    console.log('PROTO', doc)
    doc.once('sync', function (id) {
      console.log("DOC SYNC", id)
      if(doc.id !== this.id) return
      var loc = doc.get('party')
      if(!loc.get('party'))
        loc.set({host: host, party: party}) 
    })
    stream.pipe(crdt.createStream(doc)).pipe(stream)
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
