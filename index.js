#!/usr/bin/env node
var Sbot = require('ssb-server')
var ssbConfigInject = require('ssb-config/inject')
var caps = require('ssb-caps')
var ssbKeys = require('ssb-keys')
var path = require('path')
var S = require('pull-stream')
var minimist = require('minimist')

function startSbot (appName, cb) {
    // -------- setup --------------------
    var opts = { caps }
    var config = ssbConfigInject(appName, opts)
    var keyPath = path.join(config.path, 'secret')
    config.keys = ssbKeys.loadOrCreateSync(keyPath)
    // error, warning, notice, or info (Defaults to notice)
    config.logging.level = 'notice'
    // -----------------------------------------

    var sbot = Sbot
        .use(require('ssb-master'))
        .call(null, config)

    sbot.whoami(function (err, info) {
        var { id } = info
        cb(err, { id, sbot })
    })
}

function getPosts ({ id, sbot, type }) {
     return S(
        sbot.createUserStream({ id }),
        S.filter(function (msg) {
            return msg.value.content.type === type
        })
    )
}

var ssbWeb = {
    getPosts,
    startSbot
}

if (require.main === module) {
    var args = minimist(process.argv.slice(2))
    console.log('args', args)
    var appName =  args._[0] || 'ssb'
    console.log('appname', appName)
    var type = args._[1] || 'post'

    startSbot(appName, function (err, { id, sbot }) {
        if (err) throw err

        S(
            getPosts({ id, sbot, type }),
            S.collect(function (err, msgs) {
                console.log('msgs', msgs)
                console.log('**content**', msgs[0].value.content)
                // need to get the msg.value.content.mentions[0] hash from
                // the blob store
                // see https://github.com/ssbc/ssb-serve-blobs/blob/master/index.js#L50
                // it looks like `sbot.blobs.get`
                sbot.close(null, function (err) {
                    console.log('closed', err)
                })
            })
        )
    })
}

module.exports = ssbWeb
