// ==UserScript==
// @name        Pixiv Quick Preview
// @description Preview media without opening the post page.
// @namespace   relaxeaza/userscripts
// @version     1.0.1
// @grant       none
// @run-at      document-start
// @icon        https://i.imgur.com/pi2aL2k.jpg
// @include     https://www.pixiv.net/stacc*
// @include     https://www.pixiv.net/en/*
// @downloadURL https://gitlab.com/relaxeaza/userscripts/raw/master/pixiv-quick-preview.user.js
// @noframes
// ==/UserScript==

let timerId
let $overlay
let $loading
let $media
let observers = []
const rextracturl = /(?:img-master|custom-thumb)\/img(\/\d{4}\/(?:\d{2}\/){5})(\d+)_p0/

const pagesData = [
    // https://www.pixiv.net/en/
    ['home', {
        match: /^\/en\/$/,
        selectors: [{
            posts: '.gtm-illust-recommend-zone .image-item:not(.rlx-listener), .everyone-new-illusts .image-item:not(.rlx-listener)'
        }]
    }],

    // https://www.pixiv.net/en/users/$ARTIST_ID
    ['profile', {
        match: /^\/en\/users\/\d+$/,
        selectors: [{
            posts: 'section:first-child ul > li:not(.rlx-listener)',
            waitfor: 'section:first-child ul > li'
        }, {
            posts: '._1Ed7xkM:not(.rlx-listener)',
            waitfor: 'ul._2WwRD0o._2WyzEUZ ._1Ed7xkM'
        }]
    }],

    // https://www.pixiv.net/en/users/$ARTIST_ID/illustrations OR /artworks
    ['user_illustrations', {
        match: /^\/en\/users\/\d+\/(illustrations|artworks)$/,
        selectors: [{
            posts: 'section ul > li:not(.rlx-listener)',
            waitfor: 'section ul > li',
            observe: 'section ul'
        }]
    }],

    // https://www.pixiv.net/stacc
    ['stacc', {
        match: /^\/stacc$/,
        selectors: [{
            posts: '#stacc_timeline a.work:not(.rlx-listener)',
            waitfor: '#stacc_timeline .work',
            observe: '#stacc_timeline'
        }]
    }],

    // https://www.pixiv.net/stacc/$ARTIST_ID
    ['user_stacc', {
        match: /^\/stacc\/.+$/,
        selectors: [{
            posts: '#stacc_center_timeline a.work:not(.rlx-listener)',
            waitfor: '#stacc_center_timeline .work',
            observe: '#stacc_center_timeline'
        }]
    }],

    // https://www.pixiv.net/en/artworks/$ILLUST_ID
    ['illustration', {
        match: /^\/en\/artworks\/\d+$/,
        selectors: [{
            posts: 'main nav:first-child > div > div:not(.rlx-listener)',
            waitfor: 'main nav:first-child > div > div',
            observe: 'main nav:first-child > div'
        }, {
            posts: 'ul.gtm-illust-recommend-zone > li:not(.rlx-listener)',
            waitfor: 'ul.gtm-illust-recommend-zone > li',
            observe: 'ul.gtm-illust-recommend-zone'
        }]
    }]
]

function init () {
    $overlay = document.createElement('div')
    $loading = document.createElement('span')
    $media = document.createElement('img')

    $overlay.style['position'] = 'fixed'
    $overlay.style['display'] = 'none'
    $overlay.style['place-content'] = 'center';
    $overlay.style['align-items'] = 'center';
    $overlay.style['top'] = '0px'
    $overlay.style['left'] = '0px'
    $overlay.style['width'] = '100%'
    $overlay.style['height'] = '100%'
    $overlay.style['background'] = '#00000075'
    $overlay.style['font-size'] = 'x-large'
    $overlay.style['color'] = 'white'
    $overlay.style['pointer-events'] = 'none'
    $overlay.style['z-index'] = '10'

    $loading.innerText = 'loading...'
    $loading.style['position'] = 'absolute'
    $loading.style['z-index'] = '1'

    $media.style['max-width'] = '90%'
    $media.style['max-height'] = '90%'
    $media.style['width'] = 'auto'
    $media.style['height'] = 'auto'
    $media.style['z-index'] = '2'
    $media.style['pointer-events'] = 'none'

    $overlay.appendChild($loading)
    $overlay.appendChild($media)
    document.body.appendChild($overlay)

    setupPage()

    let previousState = window.history.state

    setInterval(function() {
        if (previousState !== window.history.state) {
            previousState = window.history.state

            observers.forEach(function (observer) {
                observer && observer.disconnect()
            })

            observers = []
            hidePreview()
            setupPage()
        }
    }, 1000)
}

const setupPage = function () {
    for ([page, data] of pagesData) {
        if (data.match.test(location.pathname)) {
            data.selectors.forEach(function (sectionSelector) {
                setupSection(sectionSelector)
            })

            break
        }
    }
}

const getSource = function (squareURL) {
    const match = squareURL.match(rextracturl)

    if (match && match[1]) {
        return `https://i.pximg.net/img-master/img${match[1]}${match[2]}_p0_master1200.jpg`
    }
}

const onSelectorReady = function (selector, callback) {
    if (!selector || document.querySelector(selector)) {
        callback()
    } else {
        setTimeout(function () {
            onSelectorReady(selector, callback)
        }, 500)
    }
}

const setupSection = function (sectionSelector) {
    onSelectorReady(sectionSelector.waitfor, function () {
        if (sectionSelector.observe) {
            const observer = new MutationObserver(function () {
                setupSectionListeners(sectionSelector)
            }).observe(document.querySelector(sectionSelector.observe), {
                childList: true
            })

            observers.push(observer)
        }

        setupSectionListeners(sectionSelector)
    })
}

const setupSectionListeners = function (sectionSelector) {
    const $posts = document.querySelectorAll(sectionSelector.posts)

    $posts.forEach(function ($post) {
        $post.classList.add('rlx-listener')

        $post.addEventListener('mouseenter', function (event) {
            timerId = setTimeout(function () {
                showPreview($post.querySelector('img').src)
            }, 300)
        })

        $post.addEventListener('mouseleave', hidePreview)
    })
}

const showPreview = function (src) {
    $media.src = getSource(src)
    $overlay.style.display = 'flex'
}

const hidePreview = function () {
    clearTimeout(timerId)
    $overlay.style.display = 'none'
    $media.src = ''
}

document.addEventListener('DOMContentLoaded', init)
