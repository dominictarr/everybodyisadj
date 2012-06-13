/*
  connected in/out
*/
var j = $

module.exports = function (emitter) {
  var connect
  var interval
  var el = j('<span id=status>')
    .append(connect = j('<a href=#>'))
    .append('<br/>')
    .append(flow = j('<span>'))
    .css({display: 'inline-block', width: '50px', fontSize: '10px', textAlign: 'right'})

  connect.click(function () {
    if(emitter.connected)
      emitter.disconnect()
    else
      emitter.connect()
  })

  emitter.on('flow', function (s,r) {
    flow.text(s + '/' + r)
  })

  function update () {
    connect.text(
      emitter.connected ? 'connected' : 'disconnected'
    )
  }

  emitter.on('connect', update)
  emitter.on('disconnect', update)
  emitter.on('reconnecting', function (time) {
    var start = Date.now()
    var seconds = Math.round(time / 1000)
    clearInterval(interval)
    interval = setInterval(function () {
      if(!emitter.connected && seconds)
        connect.text('connect in:'+ (seconds --))
      else
        clearInterval(interval)
    }, 1e3)
  })
  update()
  //TODO show time to reconnection.
  //     colour code send/recv ?
  return el
}
