# ssb web

Pronounced 'sbweb'
Create a traditional website from a secure scuttlebutt log

---------------------------------------

The ssb app name is passed as the first CLI argument

## example
Read a log stored at `~/.ssb-ev-DEV`, returning messages of type 'ev.post'
```
$ ./index.js ssb-ev-DEV ev.post --blobs=example-dir
```

## API example
```js
var ssbWeb = require('ssb-web')
var S = require('pull-stream')

ssbWeb.startSbot('ssb-ev-DEV', function (err, { id, sbot }) {
    S(
        ssbWeb.getPosts({ id, sbot, type: 'ev.post' }),

        // return a through stream from posts to { post, blob }
        // where `blob` is a string -- the slugified hash of the file
        // (the url where to get it). here files would be written to
        // currentFoler/example/folder/hash
        ssbWeb.writeFiles(sbot, 'example/folder'),

        // this means `current-directpry/example/blobs-dir`
        ssbWeb.writeFiles(sbot, 'example/blobs-dir'),

        S.through(function noop () {}, function onEnd (err) {
            // close the sbot here
            console.log('**on end**', err)
            sbot.close(null, function (err) {
                console.log('closed', err)
            })
            if (err) throw err
        }),

        S.collect((err, msgs) => {
            // msgs is [{post, blob}]
            // blob is the slugified filename
            console.log('collected messages', err, msgs)
            // post { type, text, mentions }
            console.log('content', msgs[0].value.content)
        })
    )
})
```

----------------------------------------------------------------
