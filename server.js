var connect = require('connect')
var _bs = require('browser-stream')
var skates = require('skates')
var crdt = require('crdt')
var users = {}

var fs = require('fs')
var es = require('event-stream')
var rpc = require('rpc-stream')

var watch = require('watch')

var store = require('./crdt-session-store')()
var users = store.doc

var kv = require('kv')(process.env.HOME + '/.isadj/data')
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
var parseCookie = require('connect').utils.parseCookie;

function streamRouter(io) { //passin io.sockets or a skates instance... refactor this.

  var routes = [], user 
  io.on('connection', function (sock) {
    sock.once('auth', function (k) {
      sock.handshake = k
      console.log('HANDSHAKE', k)
      user = users.get(k)
    }) 
    var bs = _bs(sock)
    bs.on('connection', function (stream) {
      for (var i in routes) {
        var r = routes[i]
        var type = typeof r.matcher
        if( type == 'function' ? r.matcher(stream, user)
          : type == 'string'   ? r.matcher == stream.name
          :                      r.matcher.test(stream.name) )
          return r.action(stream, user)}
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
  stream.on('close', function () {
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

var app = skates({cache: false})
  .use(connect.cookieParser('whatever'))
  .use(connect.session({
    secret: 'whatever', 
    store: store, 
    cookie: {maxAge: 86400, httpOnly: false}
  })) //how to make the cookie last forever?
  .use(function (req, res, next) {
    if(req.url != '/globals.js') return next()
    res.end(';var GLOBALS = ' + JSON.stringify({
      user_id: req.sessionID
    }) + ';\n')
  })
  .use(connect.static(__dirname+'/static'))
  .use(function (req, res, next) {
    console.log('URL', JSON.stringify(req.url))
    if(/^\/\w+\/\w+\/?$/.test(req.url))
      res.end(index)
    else
      next() //this will mean an error...
  })
  .listen(process.env.PORT || 3000, function () {
    console.log('listening on ' + process.env.PORT || 3000)
  })
/*
session stuff, unfortunately socket.io doesn't do much handholding here.
probably gotta wrap all this up in one thing that makes streams over socket.io easy.
with cookies for sessions.
*/
/*
io.configure(function (){
  io.set('authorization', function (handshake, cb) {
    if(handshake.headers.cookie) {
      handshake.cookie = parseCookie(handshake.headers.cookie)
      // note that you will need to use the same key to grad the
      // session id, as you specified in the Express setup.
      var sid = handshake.cookie['connect.sid']
      if(sid) {
        handshake.sessionID = sid.split('.').shift() //WHY DOES SOCKET>IO append something after the .?
        var user = users.get(handshake.sessionID)
        handshake.user = user
        cb(null, true)
      }
      //why would it be calling with no cookie?
      else cb(null, true)
    }
    handshake.thing = Math.random()
  })
})
*/

/*
  move this into browser-stream?

  decouple this from browser stream, to fit TCP also.
*/
/*
  these are not separate connections.
  these are fake streams multiplexed over a single socket.io connection.
*/
function logErr(s) {
  var c = 0
  s.on('error', function(err) {
    console.error('stream error', err, ++c)
  })
  
  return s
}
function sync(doc, stream) {
  var ds = crdt.createStream(doc)
  ds
    //.pipe(es.log('SEND' + stream._id)).
    .pipe(stream)
    //.pipe(es.log('RECV' + stream._id))
    .pipe(ds)

  stream.on('error', function () {
    console.log('DESTROY', stream._id)
    ds.destroy()
  })  
}

streamRouter(app)
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
    sync(doc, stream)
  })
  .add(/^chat:/, function (stream) {
    sync(loadDoc(stream.name), stream)
  })
  .add('whoami', function (stream) {
    /*
      oh, damn. the client needs to know which user it is.
      so it's gotta get that in some particular way...
      hmm, I think what I'll do is a script tag...
    */
    sync(users, stream)
  })
  .add('rpc', function (stream) {
    logErr(stream).pipe(group(rpc(expose, true))).pipe(stream)
  })
  /*
    socket.io already supports RPG like I want, but i want to do it across streams,
    so I'm not coupled to socket.io
    really, socket.io would be better to just expose a single stream interface
    and then I could multiplex over that... or just use sockjs.
  */
