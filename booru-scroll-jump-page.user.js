// ==UserScript==
// @name        Booru Scroll Jump Page
// @description Next/prev pame after scrolling against bottom/top of the page.
// @namespace   relaxeaza/userscripts
// @version     1.1.0
// @grant       none
// @run-at      document-start
// @icon        https://i.imgur.com/pi2aL2k.jpg
// @include     https://gelbooru.com/index.php?page=post&s=list*
// @include     https://gelbooru.com//index.php?page=post&s=list*
// @include     https://danbooru.donmai.us/
// @include     https://danbooru.donmai.us/posts?*
// @downloadURL https://gitlab.com/relaxeaza/userscripts/raw/master/booru-scroll-jump-page.user.js
// ==/UserScript==

const steps_to_jump = 8

const $indicator = document.createElement('div')
const $indicatorWrapper = document.createElement('div')

function on_top () {
    return !window.scrollY
}

function on_bottom () {
    return Math.floor(document.body.offsetHeight - window.scrollY) <= document.documentElement.clientHeight
}

function get_pagination_elements () {
    const host = location.host
    const data = {}

    const loader = {
        'gelbooru.com': function () {
            let $current = document.querySelector('#paginator b')
            let $next = $current.nextElementSibling
            let $prev = $current.previousElementSibling

            return { $current, $next, $prev }
        },
        'danbooru.donmai.us': function () {
            let $current = document.querySelector('.paginator .current-page')
            let $next = $current.nextElementSibling
            let $prev = $current.previousElementSibling

            $next = $next.classList.contains('arrow') ? false : $next.childNodes[0]
            $prev = $prev.classList.contains('arrow') ? false : $prev.childNodes[0]

            return { $current, $next, $prev }
        }
    }

    return loader[location.host]()
}

function show_indicator () {
    $indicatorWrapper.style['visibility'] = 'visible'
}

function hide_indicator () {
    $indicatorWrapper.style['visibility'] = 'hidden'
    $indicator.style['width'] = '0%'
}

function set_indicator_size (steps) {
    $indicator.style['width'] = Math.round((steps + 1) / steps_to_jump * 100) + '%'
}

function init () {
    let top = on_top()
    let bottom = on_bottom()
    let steps = 0
    let jumping = false

    const $paginator = get_pagination_elements()

    $indicatorWrapper.style['position'] = 'fixed'
    $indicatorWrapper.style['display'] = 'flex'
    $indicatorWrapper.style['visibility'] = 'hidden'
    $indicatorWrapper.style['justify-content'] = 'center'
    $indicatorWrapper.style['width'] = '100%'
    $indicatorWrapper.style['height'] = '5px'
    $indicatorWrapper.style['bottom'] = '0px'

    $indicator.style['background-color'] = '#006FFA'
    $indicator.style['width'] = '0%'

    $indicatorWrapper.appendChild($indicator)
    document.body.appendChild($indicatorWrapper)

    document.addEventListener('scroll', function (event) {
        top = on_top()
        bottom = on_bottom()
    })

    document.addEventListener('wheel', function (event) {
        if (jumping) {
            return
        }

        if ($paginator.$next && bottom) {
            if (event.deltaY < 0) {
                steps = 0
                hide_indicator()
                return
            }

            show_indicator()
            set_indicator_size(steps)

            if (++steps >= steps_to_jump) {
                location.href = $paginator.$next.href
                jumping = true
            }

            return
        }

        if ($paginator.$prev && top) {
            if (event.deltaY > 0) {
                steps = 0
                hide_indicator()
                return
            }

            show_indicator()
            set_indicator_size(steps)

            if (++steps >= steps_to_jump) {
                location.href = $paginator.$prev.href
                jumping = true
            }

            return
        }
    })
}

document.addEventListener('DOMContentLoaded', init)
