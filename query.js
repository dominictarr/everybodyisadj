var j = $

module.exports = function (search, results, playlist) {

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


  var toAddToPage = []

  /*
    add elements asyncronously,
    because if you try to add too many elements
    at once the interface feels unresponsive
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


  var query = '', queued = false
  j(search).focus()
  j(search).keyup(function () {
    //don't search if the query hasn't changed.
    if(this.value.trim() == query) return 
    /*
      don't search on every key up, incase they are typing fast.
      just queue a search, in 200 ms. for example. or if they
      slowing the response a little, gives smoother feel 

      TODO: remember the order of calls, don't update from an earlier call over a later.
    */
    var self = this
    if(queued) return
    queued = true
    setTimeout(function () {
      queued = false
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

}
