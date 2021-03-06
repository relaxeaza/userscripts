// ==UserScript==
// @name        Booru Hydrus Checker
// @description Mark media that already exists on hydrus.
// @version     1.1.0
// @namespace   relaxeaza/userscripts
// @grant       none
// @run-at      document-start
// @icon        https://i.imgur.com/pi2aL2k.jpg
// @include     https://gelbooru.com/index.php?page=post&s=list*
// @include     https://gelbooru.com//index.php?page=post&s=list*
// @include     https://danbooru.donmai.us/
// @include     https://danbooru.donmai.us/posts?*
// @include     https://safebooru.org/index.php?page=post&s=list*
// @downloadURL https://gitlab.com/relaxeaza/userscripts/raw/master/booru-hydrus-checker.user.js
// ==/UserScript==

const hydrus_host = 'http://127.0.0.1:45869'
const hydrus_api_key = '146ab1723e31a2dca0348bc03576b8f7f0587d1201beb3e31a8ee0ebd85d0776'

let $style
let site_preview_handler = {}

function init () {
    create_styles()

    if (location.host in site_preview_handler) {
        hydrus_check_permission(function (permited) {
            if (permited) {
                site_preview_handler[location.host]()
            }
        })
    }
}

function add_site (host, data) {
    if (host in site_preview_handler || typeof data !== 'function') {
        return false
    }

    site_preview_handler[host] = data
    return true
}

function add_styles (css) {
    $style.innerHTML += css.join('')
}

function create_styles () {
    $style = document.createElement('style')
    document.head.appendChild($style)

    add_styles([
        '.rlx-hydrus-check {',
            'outline: 2px dotted #69c169;',
        '}'
    ])
}

function ajax (url, callback, type) {
    let req = new XMLHttpRequest()

    req.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                let result = this.responseText
            
                if (type === 'json') {
                    result = JSON.parse(result)
                } else if (type === 'html') {
                    let parser = new DOMParser()
                    result = parser.parseFromString(result, 'text/html')
                }

                callback.call(this, result)
            } else {
                callback.call(this)
            }
        }
    }

    req.open('GET', url, true)
    req.send()
}

function hydrus_url_exists (url, exists_callback) {
    let api_url = `${hydrus_host}/add_urls/get_url_files`
    api_url += `?url=${encodeURIComponent(url)}`
    api_url += `&Hydrus-Client-API-Access-Key=${hydrus_api_key}`

    ajax(api_url, function (result) {
        result.url_file_statuses.some(function (file) {
            if (file.status === 2) {
                exists_callback()
                return true
            }
        })
    }, 'json')
}

function hydrus_check_permission (callback) {
    let api_url = `${hydrus_host}/verify_access_key`
    api_url += `?Hydrus-Client-API-Access-Key=${hydrus_api_key}`

    ajax(api_url, function (result) {
        if (this.status !== 200) {
            return callback(false)
        }

        const permission = result.basic_permissions.some(function (permission) {
            return permission === 0
        })

        callback(permission)
    }, 'json')
}

add_site('danbooru.donmai.us', function () {
    document.querySelectorAll('#posts-container article').forEach(function ($post) {
        hydrus_url_exists($post.querySelector('a').href, function () {
            $post.classList.add('rlx-hydrus-check')
        })
    })
})

add_site('gelbooru.com', function () {
    document.querySelectorAll('.thumbnail-preview a').forEach(function ($post) {
        hydrus_url_exists($post.href, function () {
            $post.children[0].classList.add('rlx-hydrus-check')
        })
    })
})

add_site('safebooru.org', function () {
    document.querySelectorAll('#post-list .thumb a').forEach(function ($post) {
        hydrus_url_exists($post.href, function () {
            $post.children[0].classList.add('rlx-hydrus-check')
        })
    })
})

document.addEventListener('DOMContentLoaded', init)
