var test = require('tape')
var ssbWeb = require('../')
var rimraf = require('rimraf')
var SsbTags = require('@nichoth/ssb-tags')
var home = require('user-home')
var S = require('pull-stream')
var path = require('path')

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

test('done', function (t) {
    _sbot.close((err) => {
        rimraf.sync(path.join(home, '.' + _appName))
        console.log('deleted', _appName)
        t.error(err, 'should not have error')
        console.log('error', err)
        t.end()
    })
})

