var _bs = require('browser-stream')



var crdt = require('crdt')
var createChat = require('./chat')
var seqWidget = require('./seq-widget')
var EventEmitter = require('events').EventEmitter

function connector (url, emitter) {
  //this module is not needed on the server side
  //just make a simple thing to do an event emitter across
  //the server...
  var min = 1e3, max = 60e3
  var sock = io.connect(location.origin)
  sock.socket.options.reconnect = false

  var timer
  emitter = emitter || new EventEmitter()
  emitter.emit = function (event, data) {
    var args = [].slice.call(arguments)
    sock.emit.apply(sock,args)
  }
  emitter.reconnect = function () {
    clearTimeout(timer) //incase this has been triggered manually 
    connector(url, emitter)
  }
  emitter.disconnect = function () {
    sock.disconnect()
  }
  sock.$emit = function () {
    var args = [].slice.call(arguments)
    EventEmitter.prototype.emit.apply(sock, args)
    EventEmitter.prototype.emit.apply(emitter, args) 
  }
  function reconnect () {
    emitter.emit('reconnecting', timeout)
    sock.removeAllListeners()// we're gonna create a new connection 
    sock.removeAllListeners()
    timer = setTimeout(function () {
      connector(url, emitter)
    }, timeout)
    timeout = timeout * 2
    if(timeout > max) timeout = max
  }
  sock.on('connect_failed', reconnect)
  sock.on('disconnect', reconnect)
  sock.on('connect', function () {
    emitter.emit('connect')
    timeout = min 
  })
  return emitter
}

var bs = _bs(CONNECTOR = connector())

CONNECTOR.on('disconnect', function (data) {
  console.log('DISCONNECT', data)
}).on('connecting', function (data) {
  console.log('CONNECTING', data)
}).on('connect', function (data) {
  console.log('CONNECT!!!', data)
}).on('connect_failed', function (data) {
  console.log('CONNECT_FAILED', data)
}).on('error', function (data) {
  console.log('ERROR', data)
}).on('reconnecting', function (data) {
  console.log('RECONNECTING', data)
}).on('reconnect_failed', function (data) {
  console.log('RECONNECT_FAILED', data)
}).on('reconnect', function (data) {
  console.log('RECONNECT', data)
})

/*
IDEA:

  watch files, on a change, either:
    * restart server
    * tell clients to reload

  okay. that is definately very handy.
  I wonder if using app cache manifests
  will make it reload really fast?
  oh, yeah... they are all or nothing.
  they don't 

  maybe... go back to my merkle tree idea...
  save nearly everything in localStorage.
  when data changes, sync to local storage...
  when local storage is updated, then reload the page
  reloading from localStorage.

  now that I have users,
  can add different playlists, 
  default to everyone edits.
    everybody.is-a.dj

  if it's a private party
    jim.is-a.dj (username.is-a.dj)

  /playlist

  need to refacter client, so that can
  go to different playlists with out
  reload.
*/

function inplace (initial, cb) {
  var i = $('<input>')
  var done = false
  i.attr('value', initial)
  function edit (e) {
    if(done) return
    done = true
    cb.call(this, this.value)
    i.remove()
  }
  i.change(edit)
  i.blur(edit)
  setTimeout(function () {i.focus()}, 1)
  return i
}

var rpcs = require('rpc-stream')({
  reload: function () {
    location.reload()
  }
}, true )
var remote = REMOTE = rpcs.wrap('search')
var userDoc = USERS = new crdt.Doc()
/*
  need a way to only sync part of a document.
  do not want each user to know every user
  in thier browser.

  this will also have other applications, in peer to peer...
*/
//***************************
var uStream = crdt.createStream(userDoc)
uStream.pipe(bs.createStream('whoami', {user_id: GLOBALS.user_id})).pipe(uStream)
rpcs.pipe(bs.createStream('rpc')).pipe(rpcs)
//***************************
var user = USER = userDoc.get(GLOBALS.user_id)

//XXX vvv
var doc, playlist, party, stream, cStream, chat

function load() {
  var loc = getLocation()
  //this should be stream.destroy()
  if(doc) stream.end()
  if(chat) cStream.end()

  var href = [window.location.origin, loc.host, loc.party].join('/')

  j('#host').text(loc.host).attr('href', href)
  j('#party').text(loc.party).attr('href', href)

  doc = new crdt.Doc()
  stream = crdt.createStream(doc)
  playlist = PLAYLIST = doc.createSeq('type', 'track')
  party = PARTY = playlist.get('party')
  loc.party = loc.party || 'playlist1'

//**********************************
  stream
    .pipe(bs.createStream('proto', {
      party: loc.party
    , host: loc.host   || 'everbody'
    }))
    .pipe(stream)
//**********************************

  var party = doc.get('party').on('update', function (){
    console.log('UPDATE', party.toJSON())
    var h = party.get('host'), p = party.get('party')
  })

  seqWidget('#playlist', playlist, {
    template: itemTemplate
  })
  current = null //this will play the first track that is added.
  playlist.on('add', function (row) {
    if(current) return
    play(row.toJSON()) 
  })

  chat = new crdt.Doc()
  cStream = crdt.createStream(chat)
  cStream.pipe(bs.createStream(['chat',loc.party,loc.host || 'everybody'].join(':'))).pipe(cStream)

  createChat('#chat', chat, user) 

  //remember, when you get to disposing a doc from memory
  //to remove all the listeners. to all the rows.
}
///XXX ^^^

//assign jquery to j because it's easier to type!
var j = $
//on document load.

/*
  okay, basically got what I need.

  yt js api is RETARDED.

  global functions refured to by strings,
  numerical event types.
/
  but I got what I need to play videos...

  so, when a new item is added,
    if a video is not playing.
      play it
  when a video ends,
    play the next video.
*/

var READY = -1, ENDED = 0, PLAYING = 1, PAUSED = 2, BUFFERENG = 3, CUED = 5;
window.player = null
var current = null

//TODO refactor this out into it's own package.
//wrap around the RETARDED api. 
//and then also support soundcloud and bandcamp.

window.onYouTubePlayerAPIReady = function (playerId) {
  var _player = new YT.Player('ytplayer', {
//    height: '475',
//    width: '600',
    events: {
      onStateChange: function (data) {
        console.log('STATE CHANGE', data.data, data)
        var state = data.data
        if(!player) {

          /*
            when the READY event is emitted,
            it's not actually read.
            because I can't play a video.
            so, I'm just gonna poll until it is actually ready 
          */
          var i = setInterval(function () {
            if(!_player.loadVideoById) return
            player = _player
            if(current)
              play(current)
            clearTimeout(i)
          }, 50)
        } else if(state === ENDED) {
          var n =  playlist.next(current)
          console.log(n)
          if(!n) {
            //TODO poll this action until
            //the state becomes READY
            play(null)
            current = null
            return
          }
          play(n)
        }
      } 
    }
  })
  console.log(player)

//document.getElementById("player");
  //seriously, WTF, passing cb as string???
//  player.addEventListener('onStateChange', 'onStateChange')
  
}

function play(item) {
  if(!item)
    item = {title: '', description: '', id: ''}
  if(item instanceof crdt.Row)
    item = item.toJSON()
  console.log("PLAY", item)
  j('#nowplaying')
    .empty()
    .append(
      j('<a>').append(j('<h3>').text(item.title))
      .attr('href', 'http://www.youtube.com/watch?feature=player_embedded&v='+item.id))
    .append(j('<p>').text(item.description))

   if(player && player.loadVideoById)
    player.loadVideoById(item.id)
  
  current = item
}


function searchYT (query, cb) {
  var called  = false
  var keyword = encodeURIComponent(query);
  var yt_url  = 
    'http://gdata.youtube.com/feeds/api/videos?q='+keyword+'&format=5&max-results=20&v=2&alt=jsonc'

  function done (error, data) {
    if(called) return
    called = true
    cb(error, data)
  }
  
  j.ajax({
    type: "GET"
  , url: yt_url
  , dataType:"jsonp"
  , success: function(data) { done(null,  data) }
  , error: function (_, __, error) { done(error, null) }
  })

}

function restrictor(keys) {
  return function (e) {
    var r = {}
    for (var i in keys) {
      var k = keys[i]
      r[k] = e[k]
    }
    return r
  }
}

function itemTemplateSearch(item) {
//  var desc = item.description
//  var desc = desc.length > 100 ? desc.substring(0,100) + '...' : desc
  var el = j('<div class="search track">').attr('id', 'search_'+item.id)
    .append(
      j('<a href=#><img class=thumbnail src=http://i.ytimg.com/vi/' + item.id + '/default.jpg></a>')
        .click(function () { playlist.push(item); el.remove() })
    )
    .append('<strong>'+item.title+'</strong>')
  return el
}

function link(inner, click) {
  var a = j('<a href=#>')

  if('string' === typeof inner) a.text(inner)
  else a.append(inner)

  return a.click(click)
}

function itemTemplate(item) {
  if(item.toJSON)
    item = item.toJSON()

  var desc = item.description
  var desc = desc.length > 100 ? desc.substring(0,100) + '...' : desc
  return j('<div class="play track">').attr('id', item.id)
    .append('<img class=thumbnail src=http://i.ytimg.com/vi/' + item.id + '/default.jpg>')
    .append('<strong>'+item.title+'</strong>')
    .append(
      j('<p>')// + desc + '</p>')
      .append(link('play'  , function () { play(item) }))
      .append(document.createTextNode(' '))
      .append(link('delete', function () { playlist.remove(item.id) }))
    )
}

var toAddToPage = []

/*
  add elements asyncronously,
  because if you try to add too many elements
  at once it makes the interface unresponsive
*/

function addSearchResults() {
  var results = j('#results').empty()
  function add() {
    var item = toAddToPage.shift()
    if(!item) return 
    results.append(itemTemplateSearch(item))
    setTimeout(add, 0)
  }
  add()
}

/*
  I've just avoided the urge to write a module that
  wraps pushState, and falls back to # but does not
  include a routing library.

  but then I didn't. so we are just html5.
  maybe if this later, when/if it matters.
*/

function getLocation () { 
  var path = window.location.pathname
//  var hash = l.hash.substring(1).split('/')
//  if(hash.length < 2)
  path = path.substring(1).split('/')
  return {
    host: path.shift(), party: path.shift()
  }
}  

j(function () {

  if(window.location.pathname === '/')
    //or randomly go to playlist?
    history.pushState({}, '', '/everybody/playlist1') 
  load()
  /*seqWidget('#playlist', playlist, {
    template: itemTemplate
  })*/
  function change () {
    var val = this.value.split(':')
    var p = val.pop()
    var h = val.pop() || 'everybody'
    console.log('CHANGE', h, p)
    history.pushState({}, '', '/'+h+'/'+p )
    load()
  }

  j('#psearch').autocomplete({
    source: function (query, res) {
      remote.search(query.term, function (err, data) { 
        console.log(query.term, '?', data)
        res(data)
      })
    }
  }).change(change).keyup(function (e) {
    if(e.keyCode == 13) //Enter
      change.call(this, e)
  })

  j('.ui-autocomplete').css({
    position: 'absolute',
    background: 'whitesmoke'
  })

  function updateUser() {
    var u = j('#user')
      .html('<em>'+user.get('name')+'</em>')
      .append(link('edit', function (e) {
        u.empty().append(
          inplace(user.get('name'), function (val) {
            user.set({name: val})
          })
        )
        return false
      }))
  }

  user.on('changes', updateUser)
  if(user.get('name'))
    updateUser()

  j('#search').focus()
  var query = '', queued = false
  j('#search').keyup(function () {
    //don't search if the query hasn't changed.
    //like if a alphanumeric key is pressed
    if(this.value.trim() == query) return 
    /*
      don't search on every key up, incase they are typing fast.
      just queue a search, in 200 ms. for example. or if they
      slowing the response a little, gives smoother feel 
    */
    var self = this
    if(queued) return
    queued = true
    setTimeout(function () {
      queued = false
      console.log('SEARCH',self.value.trim()) 
      searchYT(query = self.value.trim(), function (err, data) {
        returned = true
        if(err)
          return console.error(err)
        var items = data.data.items.map(restrictor('id,uploader,title,description,rating'.split(',')))
        items.forEach(function (e) {
          toAddToPage.push(e)
        })
        addSearchResults()

      })
    }, 200)
  })
})

