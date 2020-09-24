# ssb web

Pronounced 'sbweb'
Create a traditional website from a secure scuttlebutt log

---------------------------------------

The ssb app name is passed as the first CLI argument

## example
Read a log stored at `~/.ssb-ev-DEV`, returning messages of type 'ev.post'
```
$ ./index.js ssb-ev-DEV ev.post
```

## API example
```js
var ssbWeb = require('../')
var S = require('pull-stream')

ssbWeb.startSbot('ssb-ev-DEV', function (err, { id, sbot }) {
    S(
        ssbWeb.getPosts({ id, sbot, type: 'ev.post' }),

        S.through(function noop () {}, function onEnd (err) {
            sbot.close(null, function (err) {
                console.log('closed', err)
            })
            if (err) throw err
        }),

        S.collect((err, msgs) => {
            console.log('collected messages', err, msgs)
        })
    )
})
```

https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e -- a nice node CLI guide

[sbot.blobs.get](https://github.com/ssbc/ssb-serve-blobs/blob/master/index.js#L50)

[blobs.get method](https://github.com/ssbc/multiblob#blobsget-hash--opts--source)


You can pipe the blob stream to the fs module
```js
toStream(sbot.blobs.get(hash))
    .pipe(fs.createWriteStream(path))
```


Make a static site generator that creates a page for each post


