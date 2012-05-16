var _bs = require('browser-stream')
var bs = _bs(io.connect('http://localhost:3000'))

var crdt = require('crdt')

var seqWidget = require('./seq-widget')

var doc = new crdt.Doc()
var stream = crdt.createStream(doc)
var playlist = PLAYLIST = doc.createSeq('type', 'track')

stream.pipe(bs.createStream('proto')).pipe(stream)

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

window.onStateChange = function (state) {
  console.log('STATE', state)
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
  console.log('READY')
//  player.playVideo()
  //seriously, WTF, passing cb as string???
  player.addEventListener('onStateChange', 'onStateChange')
}

playlist.on('add', function (row) {
  console.log('ADD', row)
  var id = row.get('id')
  if(current) return
  player.loadVideoById(id)
  current = id 
})

;(function () {
   var params = { allowScriptAccess: "always" };
    var atts = { id: "ytplayer" };
    swfobject.embedSWF("http://www.youtube.com/v/ylLzyHk54Z0&enablejsapi=1&playerapiid=ytplayer&loop=1"
      , "ytplayer"
      , "425"
      , "336"
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

function itemTemplate(item) {
  if(item.toJSON)
    item = item.toJSON()

  var desc = item.description
  var desc = desc.length > 100 ? desc.substring(0,100) + '...' : desc
  return j('<li class=track>').attr('id', item.id)
    .append('<img class=thumbnail src=http://i.ytimg.com/vi/' + item.id + '/default.jpg>')
    .append('<h4>'+item.title+'</h4>')
    .append('<p>' + desc + '</p>')
    .append('<label>rating: ' + item.rating + '</label>')
    .append(j('<a href=#>add</a>').click(function () { playlist.push(item) }))
}

j(function () {

  seqWidget('#playlist', playlist, {
    template: itemTemplate
  })

  j('#search').focus()
  var query = ''
  j('#search').keyup(function () {
    console.log('SEARCH', this.value)
    //don't search if the query hasn't changed.
    //like if a alphanumeric key is pressed
    if(this.value.trim() == query) return 
    query = this.value.trim()

    searchYT(this.value, function (err, data) {
      if(err)
        return console.error(err)
      console.log(data.data)
      var items = data.data.items.map(restrictor('id,uploader,title,description,rating'.split(',')))
      var results = j('#results').empty()
      items.forEach(function (e) {
        results.append(itemTemplate(e))
      })

    })
  })
})

