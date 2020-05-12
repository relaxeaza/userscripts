// ==UserScript==
// @name        Pixiv Quick Preview
// @description Preview media without opening the post page.
// @namespace   relaxeaza/userscripts
// @version     1.0.0
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

const rpost = /(?:img-master|custom-thumb)\/img(\/\d{4}\/(?:\d{2}\/){5})(\d+)_p0/
const rhome = /^\/en\/$/
const ruserhome = /^\/en\/users\/\d+(\/.*)?$/
const rstacc = /^\/stacc$/
const ruserstacc = /^\/stacc\/.+$/
const rartwork = /^\/en\/artworks\/\d+$/

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
            setupPage()
        }
    }, 1000)
}

const getSource = function (squareURL) {
    const match = squareURL.match(rpost)

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

const setupPage = function () {
    const sectionsSelectors = (function (pathname) {
        // https://www.pixiv.net/en/
        if (rhome.test(pathname)) {
            return [{
                posts: '.gtm-illust-recommend-zone .image-item:not(.rlx-listener), .everyone-new-illusts .image-item:not(.rlx-listener)'
            }]
        // https://www.pixiv.net/en/users/$ARTIST_ID*
        } else if (ruserhome.test(pathname)) {
            return [{
                posts: '._1Ed7xkM:not(.rlx-listener)',
                waitfor: 'ul._2WwRD0o._2WyzEUZ ._1Ed7xkM'
            }]
        // https://www.pixiv.net/stacc
        } else if (rstacc.test(pathname)) {
            return [{
                posts: '#stacc_timeline a.work:not(.rlx-listener)',
                waitfor: '#stacc_timeline .work',
                observe: '#stacc_timeline'
            }]
        // https://www.pixiv.net/stacc/$ARTIST_ID
        } else if (ruserstacc.test(pathname)) {
            return [{
                posts: '#stacc_center_timeline a.work:not(.rlx-listener)',
                waitfor: '#stacc_center_timeline .work',
                observe: '#stacc_center_timeline'
            }]
        // https://www.pixiv.net/en/artworks/$ILLUST_ID
        } else if (rartwork.test(pathname)) {
            return [{
                posts: 'main nav:first-child > div > div:not(.rlx-listener)',
                waitfor: 'main nav:first-child > div > div',
                observe: 'main nav:first-child > div'
            }, {
                posts: 'ul.gtm-illust-recommend-zone > li:not(.rlx-listener)',
                waitfor: 'ul.gtm-illust-recommend-zone > li',
                observe: 'ul.gtm-illust-recommend-zone'
            }]
        }

        return false
    })(location.pathname)

    if (!sectionsSelectors) {
        return
    }

    sectionsSelectors.forEach(function (sectionSelector) {
        setupSection(sectionSelector)
    })
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
                $media.src = getSource($post.querySelector('img').src)
                $overlay.style.display = 'flex'
            }, 300)
        })

        $post.addEventListener('mouseleave', function (event) {
            clearTimeout(timerId)
            $overlay.style.display = 'none'
            $media.src = ''
        })
    })
}

document.addEventListener('DOMContentLoaded', init)
