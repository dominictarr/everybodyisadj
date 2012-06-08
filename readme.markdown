
TODO

  * create new playlist. --needs style
  * edit playlist name. --NO
  * edit user name  - DONE
  * link to the right playlists --DONE
  * some way to switch playlists --search?
    - want auto suggest type thing --DONE
    - but also, show [create new] when a name is not matched.
    - okay -- that is easy with a source: function (req, res) {
      can probably hack it so that can add items in real time.
      BECAUSE THAT IS HOW EVERYTHING SHOULD BE!
  * need req-res RPC interface for streams, to call the server to search.. -- DONE.
    or, just use a stream? down the road, I'd want streams. now I'd want rpc.
  * make the video change when you load a new playlist. --done
  * make the video change if the currently playing video is deleted.
  * chat. --done
  * dashboards. 

then publish to internets.


issues from simon:

  - stream becomes unstuck? loosing a connection should be able to reconnect. look into disconnect methods.
    --this is fixed, but had gone to sockjs and that breaks users. this could be easy to fix, actually.
