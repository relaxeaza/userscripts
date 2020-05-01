// ==UserScript==
// @name        Hydrus Checker
// @namespace   Hydrus Checker
// @grant       none
// @author      Relaxeaza
// @version     1.0.0
// @include     https://gelbooru.com/index.php?page=post&s=list*
// @include     https://gelbooru.com//index.php?page=post&s=list*
// @include     https://danbooru.donmai.us/
// @include     https://danbooru.donmai.us/posts?*
// @include     https://safebooru.org/index.php?page=post&s=list*
// @run-at      document-start
// ==/UserScript==

const SETTINGS = {
    HYDRUS_URL: 'http://127.0.0.1:45869',
    HYDRUS_KEY: '146ab1723e31a2dca0348bc03576b8f7f0587d1201beb3e31a8ee0ebd85d0776'
}

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
            'width: 14px;',
            'height: 14px;',
            'position: absolute;',
            'border-radius: 2px;',
            'background-color: #77dd77;',
            'box-shadow: 0 1px 1px #6bc76b, -2px 2px 1px #00000080;',
            'text-align: center;',
            'color: #000000;',
        '}',

        '.rlx-hydrus-check::after {',
            'content: "✓"',
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
    let api_url = `${SETTINGS.HYDRUS_URL}/add_urls/get_url_files`
    api_url += `?url=${encodeURIComponent(url)}`
    api_url += `&Hydrus-Client-API-Access-Key=${SETTINGS.HYDRUS_KEY}`

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
    let api_url = `${SETTINGS.HYDRUS_URL}/verify_access_key`
    api_url += `?Hydrus-Client-API-Access-Key=${SETTINGS.HYDRUS_KEY}`

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
    add_styles([
        '.rlx-hydrus-check {',
            'margin-left: 4px;',
            'margin-top: -18px;',
            'line-height: 17px;',
        '}'
    ])

    document.querySelectorAll('#posts-container article').forEach(function ($post) {
        const $archor = $post.querySelector('a')

        hydrus_url_exists($archor.href, function () {
            const $checked = document.createElement('div')
            $checked.className = 'rlx-hydrus-check'
            $archor.appendChild($checked)
        })
    })
})

add_site('gelbooru.com', function () {
    add_styles([
        '.rlx-hydrus-check {',
            'margin-left: -9px;',
            'margin-top: -4px;',
            'line-height: 14px;',
        '}'
    ])

    document.querySelectorAll('.thumbnail-preview a').forEach(function ($post) {
        hydrus_url_exists($post.href, function () {
            const $checked = document.createElement('div')
            $checked.className = 'rlx-hydrus-check'
            $post.appendChild($checked)
        })
    })
})

add_site('safebooru.org', function () {
    add_styles([
        '.rlx-hydrus-check {',
            'line-height: 14px;',
        '}'
    ])

    document.querySelectorAll('#post-list .thumb a').forEach(function ($post) {
        hydrus_url_exists($post.href, function () {
            const $checked = document.createElement('div')
            $checked.className = 'rlx-hydrus-check'
            $post.appendChild($checked)
        })
    })
})

document.addEventListener('DOMContentLoaded', init)
