var ssbWeb = require('../')
var S = require('pull-stream')

ssbWeb.startSbot('ssb-ev', function (err, { id, sbot }) {
    S(
        ssbWeb.getPosts({ id, sbot, type: 'ev.post', reverse: true }),

        ssbWeb.writeFiles(sbot, 'example/blobs-dir'),

        S.through(function noop () {}, function onEnd (err) {
            console.log('**on end**', err)
            sbot.close(null, function (err) {
                console.log('closed', err)
            })
            if (err) throw err
        }),

        S.collect((err, msgs) => {
            console.log('collected messages', err, msgs)
            // { type, text, mentions }
            console.log('woo')
            console.log('**content**', msgs[0].post.value.content)
        })
    )
})

