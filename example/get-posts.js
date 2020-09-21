var ssbWeb = require('../')
var S = require('pull-stream')

ssbWeb.startSbot('ssb-ev-DEV', function (err, { id, sbot }) {
    console.log('aaaaaaaa', id)
    S(
        ssbWeb.getPosts({ id, sbot, type: 'ev.post' }),

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
            console.log('content', msgs[0].value.content)
        })
    )
})

