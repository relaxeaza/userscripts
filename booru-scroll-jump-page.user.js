// ==UserScript==
// @name        Booru Scroll Jump Page
// @namespace   Booru Scroll Jump Page
// @grant       none
// @author      Relaxeaza
// @version     1.0.0
// @include     https://gelbooru.com/index.php?page=post&s=list*
// @include     https://gelbooru.com//index.php?page=post&s=list*
// @run-at      document-start
// ==/UserScript==

const SETTINGS = {
    steps2jump: 10
}

function onTop () {
    return !window.scrollY
}

function onBottom () {
    return Math.floor(document.body.offsetHeight - window.scrollY) <= document.documentElement.clientHeight
}

function init () {
    let top = onTop()
    let bottom = onBottom()
    let steps = 0
    let jumping = false

    const $currentPage = document.querySelector('#paginator b')
    const $nextPage = $currentPage.nextElementSibling
    const $prevPage = $currentPage.previousElementSibling

    document.addEventListener('scroll', function (event) {
        top = onTop()
        bottom = onBottom()
    })

    document.addEventListener('wheel', function (event) {
        if (jumping) {
            return
        }

        if ($nextPage && bottom) {
            if (event.deltaY < 0) {
                steps = 0
                return
            }

            if (++steps >= SETTINGS.steps2jump) {
                location.href = $nextPage.href
                jumping = true
            }

            return
        }

        if ($prevPage && top) {
            if (event.deltaY > 0) {
                steps = 0
                return
            }

            if (++steps >= SETTINGS.steps2jump) {
                location.href = $prevPage.href
                jumping = true
            }

            return
        }
    })
}

document.addEventListener('DOMContentLoaded', init)
