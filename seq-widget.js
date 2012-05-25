//depends on jquery-ui
/*
  this may be a problem that it does not iterate over
  the list to display initial contents...
  TODO FIX THIS
*/
module.exports = seqWidget

function seqWidget( el, seq, opts) {
  el = $(el).empty() //clear any old elements
  var name = el.attr('id')
  var template = opts.template
  
  function update (r) { 
    var li = $('#'+r.id)
    li = li.length ? li : $(template(r))

    var i = seq.indexOf(r) 
    if(el.children().index(li) == i) return //already in place

    var next = seq.next(r)
    if (next) li.insertBefore($('#'+next.id)) 
    else el.append(li) 
  }

  seq.on('remove', function (r) {
    var item = $('#'+r.id)
    if(~el.children().index(item))
      item.remove() 
  })

  seq.on('move', update) //when a member of the set updates

  function change (_, ui) {
    var itemId = ui.item.attr('id')
    var i = $(this).children().index(ui.item)
    //update event is emitted when a item is removed from a set.
    //in that case i will be -1. 
    //changeSet will detect the correct index, though.
    //if item is not already in correct position, move
    if(~i && seq.indexOf(itemId) !== i)
      seq.before(itemId, ui.item.next().attr('id'))
  }

  opts.receive = change
  opts.update  = change

  el.sortable(opts)

  return el
  
}
