var test = require('tape')
var ssbWeb = require('../')
var rimraf = require('rimraf')
var SsbTags = require('@nichoth/ssb-tags')
var home = require('user-home')
var S = require('pull-stream')
var path = require('path')

var toPull = require('stream-to-pull-stream')
var fs = require('fs')
var sharp = require('sharp')
var glob = require('glob')

var _sbot
var _id
var _appName
test('ssbWeb starts', function (t) {
    var plugins = [
        SsbTags({ postType: 'post' })
    ]
    var appName = 'ssb-web-TEST-' + new Date().getTime()
    _appName = appName
    ssbWeb.startSbot(appName, plugins, function (err, { id, sbot }) {
        _sbot = sbot
        _id = id
        t.ok(sbot.tags, 'should have the plugin')

        sbot.publish({
            type: 'post',
            text: 'hello world #test'
        }, function (err, msg) {
            t.error(err, 'should not have error')
            t.end()
        })
    })
})

test('get posts', function (t) {
    t.plan(2)

    S(
        ssbWeb.getPosts({ id: _id, sbot: _sbot, type: 'post' }),
        S.collect(function (err, posts) {
            t.ok(posts[0], 'should have the post')
            t.equal(posts[0].value.content.text, 'hello world #test',
                'should have the right post content')
        })
    )
})

test('write files', function (t) {
    t.plan(5)

    // ----- first publish some files -----------------------------------
    S(
        toPull(fs.createReadStream(__dirname + '/cinnamon-roll.jpg')),
        _sbot.blobs.add((err, hash) => {

            _sbot.publish({
                type: 'post',
                text: 'test2',
                mentions: [{
                    link: hash        // the hash given by blobs.add
                }]
            }, function (err, msg) {
                t.error(err, 'shouold not have error')
    // --------------------------------------------------

                S(
                    ssbWeb.getPosts({ id: _id, sbot: _sbot, type: 'post' }),
                    ssbWeb.writeFiles(_sbot, __dirname + '/imgs'),
                    S.drain(function onEvent () {
                        // noop
                    }, function onEnd (err) {
                        t.error(err, 'shouold not have error')

                        // now write the second file
                        glob(__dirname + '/imgs/*', (err, files) => {
                            files.forEach(function (fileName) {

                                var outPath = __dirname + '/output.jpg'
                                sharp(fileName)
                                    .resize(500)
                                    .toFile(outPath, err => {
                                        t.error(err, 'should not have error')
                                        fs.stat(outPath, (err, stats) => {
                                            t.error(err, 'no error')
                                            t.ok(stats, 'file stats')
                                        })
                                    })
                            })
                        })
                    })
                )
            })
        })
    )



})

test('done', function (t) {
    _sbot.close((err) => {
        rimraf.sync(path.join(home, '.' + _appName))
        console.log('deleted', _appName)
        t.error(err, 'should not have error')
        console.log('error', err)
        t.end()
    })
})
