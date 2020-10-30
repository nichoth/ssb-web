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
// var filenamify = require('filenamify')
var slugify = require('@sindresorhus/slugify')


function startSbot (appName, plugins, cb) {
    // -------- setup --------------------
    var opts = { caps }
    var config = ssbConfigInject(appName, opts)
    var keyPath = path.join(config.path, 'secret')
    config.keys = ssbKeys.loadOrCreateSync(keyPath)
    // error, warning, notice, or info (Defaults to notice)
    config.logging.level = 'notice'
    // -----------------------------------------

    Sbot.use(require('ssb-master'))
        .use(require('ssb-blobs'))

    plugins.forEach(function (plugin) {
        Sbot.use(plugin)
    })

    var sbot = Sbot(config)

    sbot.whoami(function (err, info) {
        var { id } = info
        cb(err, { id, sbot })
    })
}

function getPosts ({ id, sbot, type, reverse }) {
     return S(
        sbot.createUserStream({ id, reverse }),
        S.filter(function (msg) {
            return msg.value.content.type === type
        })
    )
}

function writeFiles (sbot, dir) {
    return S.map(function (post) {
        // TODO it should write all the mentions, not just the first one
        var hash = post.value.content.mentions[0].link
        var slug = slugify(hash)
        if (!hash) return
        mkdirp.sync(dir)
        var filePath = path.resolve(dir, slug)

        S(
            sbot.blobs.get(hash),
            WriteFile(filePath, {}, function (err) {
                if (err) throw err
            })
        )

        return { post, blob: slug }
    })
}

var ssbWeb = {
    getPosts,
    startSbot,
    writeFiles
}

if (require.main === module) {
    var args = minimist(process.argv.slice(2))
    console.log('args', args)
    var appName =  args._[0] || 'ssb'
    console.log('appname', appName)
    var type = args._[1] || 'post'
    var blobsDir = path.resolve(args.blobs || '')

    startSbot(appName, function (err, { id, sbot }) {
        if (err) throw err

        S(
            getPosts({ id, sbot, type }),

            S.through(function noop(){}, function onEnd (err) {
                if (err) throw err
                sbot.close(null, function (err) {
                    console.log('sbot closed', err)
                })
            }),

            writeFiles(sbot, blobsDir),

            S.drain(function ({ post, blob }) {
                console.log('post', post, '**blob**', blob)
            })
        )
    })
}

module.exports = ssbWeb

