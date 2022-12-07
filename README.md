# Stream Elements - Song Request Queue Shuffle Widget
This *Stream Elements* widget will shuffle the *Song Request* queue whenever the streamer or mod types `!srShuffle` in chat.

## Setup
- Add a new Custom Widget to the layout
- Remove all the **HTML** and **CSS**
- Replace the 
    - **JS** with contents of `./src/widget.js`
    - **FIELDS** with contents of `./src/widget.json`
- Provide your Stream Elements **JWT Token** in the field
- [*Optionally*] Change the trigger phrase to whatever you'd like
- Add the layout to your stream

> **NOTE:** Be careful as to not leave any *PREVIEWS* or layout edit windows opened since each one of those has an instance of this widget running which will cause the multiplication of all the songs in queue (1 copy per opened widget)

> **NOTE:** Due to lacks in SE API all of the songs will be **DELETED** from the queue and then **ADDED again** (after getting shuffled) which will wipe the data about original song requester (since now all of them have been added using the streamers JWT Token)

