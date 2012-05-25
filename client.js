var _bs = require('browser-stream')
var bs = _bs(io.connect('http://localhost:3000'))

var crdt = require('crdt')

var seqWidget = require('./seq-widget')

/*
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

var userDoc = USERS = new crdt.Doc()
var uStream = crdt.createStream(userDoc)
/*
  need a way to only sync part of a document.
  do not want each user to know every user
  in thier browser.

  this will also have other applications, in peer to peer...
*/

uStream.pipe(bs.createStream('whoami', {user_id: GLOBALS.user_id})).pipe(uStream)
var user = USER = userDoc.get(GLOBALS.user_id)

//XXX vvv
var doc, playlist, party

function load(loc) {
  doc = new crdt.Doc()
  var stream = crdt.createStream(doc)
  playlist = PLAYLIST = doc.createSeq('type', 'track')
  party = PARTY = playlist.get('party')
  stream
    .pipe(bs.createStream('proto', {
      party: loc.party || 'playlist1'
    , host: loc.host   || 'everbody'
    }))
    .pipe(stream)
  playlist.on('add', function (row) {
    if(current) return
    play(row.toJSON()) 
  })
  var party = doc.get('party').on('update', function (){
    console.log('UPDATE', party.toJSON())
    j('#host').text(party.get('host'))
    j('#party').text(party.get('party'))
  })
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

  but I got what I need to play videos...

  so, when a new item is added,
    if a video is not playing.
      play it
  when a video ends,
    play the next video.
*/


var READY = -1, ENDED = 0, PLAYING = 1, PAUSED = 2, BUFFERENG = 3, CUED = 5;
var player = null
var current = null

//TODO refactor this out into it's own package.
//wrap around the RETARDED api. 
//and then also support soundcloud and bandcamp.

window.onStateChange = function (state) {
  if(state === ENDED) {
    var n =  playlist.next(current)
    if(!n) {
      player.clearVideo()
      current = null
      return
    }
    player.loadVideoById(current = n.get('id'))
  }
}

window.onYouTubePlayerReady = function (playerId) {
  player = document.getElementById("player");
  //seriously, WTF, passing cb as string???
  player.addEventListener('onStateChange', 'onStateChange')
  if(current)
    play(current)
}

function play(item) {
  j('#nowplaying')
    .empty()
    .append(
      j('<a>').append(j('<h3>').text(item.title))
      .attr('href', 'http://www.youtube.com/watch?feature=player_embedded&v='+item.id))
    .append(j('<p>').text(item.description))

  if(player)
    player.loadVideoById(item.id)
  current = item
}

;(function () {
   var params = { allowScriptAccess: "always" };
    var atts = { id: "ytplayer" };
    swfobject.embedSWF("http://www.youtube.com/v/ylLzyHk54Z0&enablejsapi=1&playerapiid=ytplayer&loop=1"
      , "ytplayer"
      , "600"
      , "375"
      , "8"
      , null
      , null
      , { allowScriptAccess: 'always' }
      , { id: 'player' }) 
})()

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
    .append('<h4>'+item.title+'</h4>')
  //  .append('<p>' + desc + '</p>')
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
    .append('<h4>'+item.title+'</h4>')
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

function getLocation () {
  
  var hash = window.location.hash
  if(!hash) return {}
  hash = hash.substring(1).split('/')
  return {
    host: hash.shift(), party: hash.shift()
  }
}  

j(function () {

  load(getLocation())
  seqWidget('#playlist', playlist, {
    template: itemTemplate
  })

  function updateUser() {
    j('#user').text(user.get('name'))
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

