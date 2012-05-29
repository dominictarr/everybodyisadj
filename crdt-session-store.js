var crdt = require('crdt')
var Store = require('connect/lib/middleware/session/store')

module.exports = function () {
  var exports = new Store()
  var doc = new crdt.Doc()
  exports.get = function (sid, cb) {
    var r = doc.get(sid), j
    var j = r.toJSON()
    if(!j.cookie) return cb()
    j.cookie = 'string' === typeof j.cookie ? JSON.parse(j.cookie) : j.cookie
    cb(null, j)
  }
  exports.set = function (sid, session, cb) {
    session = JSON.parse(JSON.stringify(session))
    var s = {cookie: JSON.stringify(session.cookie)}
    var r = doc.set(sid, s)
    cb && cb()
  }
  exports.destroy = function (sid, cb) {
    doc.set(sid, {__delete: true})
  }
  exports.doc = doc
  return exports
}
