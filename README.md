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
var ssbWeb = require('ssb-web')
var S = require('pull-stream')

ssbWeb.startSbot('ssb-ev-DEV', function (err, { id, sbot }) {
    S(
        ssbWeb.getPosts({ id, sbot, type: 'ev.post' }),
        S.collect((err, msgs) => {
            console.log('collected messages', err, msgs)
        })
    )
})
```

