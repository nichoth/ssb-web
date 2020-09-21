var ssbWeb = require('../')
var S = require('pull-stream')

ssbWeb.startSbot('ssb-ev-DEV', function (err, { id, sbot }) {
    S(
        ssbWeb.getPosts({ id, sbot, type: 'ev.post' }),
        S.collect((err, msgs) => {
            console.log('collected messages', err, msgs)
        })
    )
})

