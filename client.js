skates = require('skates')()

var bs = require('browser-stream')(skates)
var crdt = require('crdt')
var kv = KV = require('kv')('isdj')

var YouTubePlayer = require('youtube-player')

var seqWidget = require('./seq-widget')
var createChat = require('./chat')

var userId = GLOBALS.user_id
//decodeURI(/=([^.]+)/.exec(document.cookie)[1])

skates.emit('auth', userId)
skates.on('disconnect', function () {
  skates.emit('auth', userId)
})

PURGE = function () {
  kv.list().forEach(function (key) {
    kv.del(key, function () {
      console.log('del:', key)
    })
  })  
}
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

window.player = new YouTubePlayer({id: 'ytplayer'})


var current = null

function play(item) {
  if(!item)
    item = {title: '', description: '', id: ''}
  if(item instanceof crdt.Row)
    item = item.toJSON()
  j('#nowplaying')
    .empty()
    .append(
      j('<a>').append(j('<h3>').text(item.title))
      .attr('href', 'http://www.youtube.com/watch?feature=player_embedded&v='+item.id))
    .append(j('<p>').text(item.description))

  player.play(item.id || '')
  current = item.id
}


function logErr(s) {
  var c = 0
  s.on('error', function(err) {
    console.error('stream error', err, ++c)
  }) 
  return s
}

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

//I'm gonna need to rejig rpc-stream to do reconnects effectively.
//it needs to wrap, and then createStreams off of that.
var rpcs = require('rpc-stream')({
  reload: function (data) {
    //pass the server start time in, if the server has restarted,
    //reload too.
  //  location.reload()
  }
}, true)

var remote = REMOTE = rpcs.wrap('search')
var userDoc = USERS = new crdt.Doc()
var user = USER = userDoc.get(userId)

/*
  need a way to only sync part of a document.
  do not want each user to know every user
  in thier browser.

  this will also have other applications, in peer to peer...
*/
//***************************

function log(data) {
  console.log(data)
  return data
}

function sync(doc, name, args) {

  function write () {
    doc.createReadStream({end: false}) //track changes forever
      .pipe(kv.put(name))   
  }

  kv.has(name, function (err) {
    if(err) { //the doc is new
      doc.sync = true
      return write() 
    }
    var stream = kv.get(name)
    stream.once('end', write)
      .pipe(doc.createWriteStream())
  })

  return (function _sync() {
    var closed = 0
    var stream = doc.createStream()
      , bStream

    stream
    .pipe(
      bStream = bs.createStream.apply(bs, args)
        .on('error', function () {
          stream.destroy()
        })
        .on('close', function () {
          if(!closed++)
            process.nextTick(_sync)
        })
    ).pipe(stream)
    return stream
  })()
}

sync(userDoc, 'users', ['whoami', {user_id: GLOBALS.user_id}])

rpcs.pipe(logErr(bs.createStream('rpc'))).pipe(rpcs)

//***************************

//XXX vvv
var doc, playlist, party, stream, cStream, chat

function load() {
  var loc = getLocation()
  //this should be stream.destroy()
  if(doc) stream.destroy()
  if(chat) cStream.destroy()

  var href = [window.location.origin, loc.host, loc.party].join('/')

  j('#host').text(loc.host).attr('href', href)
  j('#party').text(loc.party).attr('href', href)

  doc = new crdt.Doc()
  var stream = sync(doc, loc.party + ':' + (loc.host || 'everybody'), ['proto', {
      party: loc.party
    , host: loc.host   || 'everbody' 
  }])
  playlist = PLAYLIST = doc.createSeq('type', 'track')
  party = PARTY = playlist.get('party')
  loc.party = loc.party || 'playlist1'

  var party = doc.get('party').on('update', function (){
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
  playlist.on('remove', function (row) {
    if(current !== row.id) return
    play(playlist.next(row))
  })
  chat = new crdt.Doc()
  var chatid = ['chat',loc.party,loc.host || 'everybody'].join(':')
  cStream = sync(chat, chatid, [chatid])

  createChat('#chat', chat, user) 

  //remember, when you get to disposing a doc from memory
  //to remove all the listeners. to all the rows.
}
///XXX ^^^

//assign jquery to j because it's easier to type!
var j = $
//on document load.



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
/*
  I've just avoided the urge to write a module that
  wraps pushState, and falls back to # but does not
  include a routing library.

  but then I didn't. so we are just html5.
  maybe if this later, when/if it matters.
*/

function getLocation () { 
  var path = window.location.pathname
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

  function change () {
    var val = this.value.split(':')
    var p = val.pop()
    var h = val.pop() || 'everybody'
    history.pushState({}, '', '/'+h+'/'+p )
    load()
  }

  j('#psearch').autocomplete({
    source: function (query, res) {
      remote.search(query.term, function (err, data) { 
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

  require('./query')('#search', '#results', playlist)

})

