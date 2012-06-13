var crdt = require('crdt')

module.exports = function (kv) {

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

    TODO count users connected to each doc.
    if there are no users, release the doc from memory.
    that could be complicated, maybe just a dispose()
    to get out of memory?

    TODO send sync messages?
    implement scuttlebut for gossip
    or scuttlebut + multicast?
  */

  return function sync2(doc, key, timer) {
    var turn, both, cs
    timer = timer || 6e5 //ten minutes

    function read(key, ready) {
      kv.has(key, function (err) {
        if(err) return ready(err)
        var ds = doc.createWriteStream()
        kv.get(key).on('end', ready).pipe(ds)
      })
    }
    function write(key) {
      var source = doc.createReadStream({end: false})
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
      setInterval(next, timer)
    }

    function next() {
      turn = !turn
      if(cs) cs.end()
      cs = write(key + '_' + (turn ? 1 : 2))
    }

    read(key + '_1', start)
    read(key + '_2', start)
  }
}
