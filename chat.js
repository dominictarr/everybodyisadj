var crdt = require('crdt')

module.exports =

function createChat (el, doc, user) {
  var input, CONTENT
  var chat = $(el) //stick everything into the chat 
    .empty()
    .append(CONTENT = $('<div class=chat_text>'))
    .append(input   = $('<input type=text>'))

  messages = null
  var messages = doc.createSet('type', 'message')

  messages.on('add', function (obj) {
    var div, span, a
    div = 
    $('<div class=line>')
      .append(
        $('<span class=message>')
        .append('<span class=user>'+obj.get('userName')+':</user>')
        .append(span = $('<span class>'))
      )
    //let me delete my own chats
    if(obj.get('userId') == user.get('id'))
    div
      .append(a = $('<a href=# class=del>del</a>')
        .click(function () {
          obj.set({__delete: true})
        })
      )

    CONTENT.append(div)

    obj.on('update', function () {
      if(obj.get('__delete')) {
        div.remove()
        obj.removeAllListeners('update')
      }
      span.text(obj.get('text'))
    })

    setTimeout(function () {
    //scroll to bottom
      CONTENT[0].scrollTop = 9999999
    }, 10)

  })

  input.change(function () {
    //enter chat message
    var m = /s\/([^\\]+)\/(.*)/.exec(this.value)
    if(m) {
      var search = m[1]
      var replace = m[2]
      //search & replace
      messages.each(function (e) {
        var item = e.get(), text = item.text
        if(text && ~text.indexOf(search) && !item.__delete) {
          e.set('text', ntext.split(search).join(replace))
        }
      })
    } else 
      doc.set('_'+Date.now(), {
        text: this.value
      , userId: user.get('id')
      , userName: user.get('name')
      , type: 'message'
      })
    this.value = ''
  })
}
