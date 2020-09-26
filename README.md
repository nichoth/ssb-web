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
            // { type, text, mentions }
            console.log('content', msgs[0].value.content)
        })
    )
})
```

----------------------------------------------------------------

[filenamify](https://www.npmjs.com/package/filenamify)

Try using the hash as a filename
