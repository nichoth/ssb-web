var Sbot = require('ssb-server')
var ssbConfigInject = require('ssb-config/inject')
var caps = require('ssb-caps')
var ssbKeys = require('ssb-keys')
var path = require('path')
var S = require('pull-stream')
var minimist = require('minimist')


// -------- setup --------------------
var args = minimist(process.argv.slice(2));
console.log('args', args)
var type = args._[1]
var appName = 'ssb'
if (args._[0]) {
    appName = args._[0]
}
console.log('appname', appName)


var opts = {}
opts.caps = caps
var config = ssbConfigInject(appName, opts)
var keyPath = path.join(config.path, 'secret')
config.keys = ssbKeys.loadOrCreateSync(keyPath)
// error, warning, notice, or info (Defaults to notice)
config.logging.level = 'notice'
// -----------------------------------------




function start () {
    var sbot = Sbot
        .use(require('ssb-master'))
        .call(null, config)

    sbot.whoami(function (err, info) {

        // need to get the msg.value.content.mentions[0] hash from
        // the blob store

        var { id } = info

        S(
            getStream(id),
            S.filter(function (msg) {
                return msg.value.content.type === type
            }),
            S.collect(function (err, msgs) {
                console.log('msgs', msgs)
                console.log('**content**', msgs[0].value.content)
                sbot.close(null, function (err) {
                    console.log('closed', err)
                })
            })
        )
    })

    function getStream (id) {
        return sbot.createUserStream({ id: id })
    }

    return sbot
}

if (require.main === module) {
    start()
}


