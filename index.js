#!/usr/bin/env node
var Sbot = require('ssb-server')
var ssbConfigInject = require('ssb-config/inject')
var caps = require('ssb-caps')
var ssbKeys = require('ssb-keys')
var path = require('path')
var S = require('pull-stream')
var minimist = require('minimist')
var WriteFile = require('pull-write-file')
var mkdirp = require('mkdirp')
// var scan = require('pull-scan')
// var FileType = require('file-type');
// var tee = require('pull-tee')


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
        .use(require('ssb-blobs'))
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
    var blobsDir = args.blobs || ''

    startSbot(appName, function (err, { id, sbot }) {
        if (err) throw err

        var n = 0
        S(
            getPosts({ id, sbot, type }),

            S.through(function noop(){}, function onEnd (err) {
                if (err) throw err
                sbot.close(null, function (err) {
                    console.log('sbot closed', err)
                })
            }),

            // S.map(post => { return {post, n: 0} }),
            // scan(function (acc, val) {
            //     console.log('acc', acc)
            //     console.log('val', val)
            //     var {post, n} = val
            //     return { post, n: (acc[n] || n) + 1 }
            // }),

            S.map(function (post) {
                var _n = n
                n++
                return { post, n: _n }
            }),

            S.drain(function ({ post, n }) {
                var hash = post.value.content.mentions[0].link
                if (!hash) return

                // post.value.content
                // { type, text, mentions }

                mkdirp.sync(__dirname + '/' + blobsDir)
                var filePath = __dirname+ '/' + blobsDir + '/file'+n
                S(
                    sbot.blobs.get(hash),
                    WriteFile(filePath, {}, function (err) {
                        console.log('file written', err)
                        if (err) throw err
                    })
                )
            })
        )
    })
}

module.exports = ssbWeb
