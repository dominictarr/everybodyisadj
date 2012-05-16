
wresteling with ko all day.

I decided that I actually really like the idea.

but the diff stuff that I have doesn't really play nice with it.

it's because I made xdiff more sophisticated than I really needed to.

example, can handle references in keys.
and all sorts of clever stuff.

idea: make a more limited difftool that:
  * only support refs in arrays. 
  * DEMAND that objects in arrays have id's
  * address all other objects by thier path.

also, need a hydrate, dehydrate function.

so, if your applying a patch to a rich object
(say knockout's observables) then updates must be handled correctly.

so, applying a patch will update or create objects.
but those objects will be hydrated.

example
SET path {key: value, type: 'thing'}
hydrate (val, path) {
  if(val.type == 'thing')
    return new Thing()
  else if('string' === typeof val)
    return ko.observable(val)
}
for example...-

dehydrate (val, path) {
  if(ko.isObservable(val))
    return val()
  else
    return ko.isObservableArray(val) ? [] : {}
}

ko doesn't have proper array updates.
so, I'll diff it with my diff stuff.

the KEY is to be able to apply a patch directly a ko ViewModel.
also, what would be awesome, is to make subscribers to the observables
so that I could log the changes.

hmm, easier to just diff.

