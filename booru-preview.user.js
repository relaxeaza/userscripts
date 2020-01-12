// ==UserScript==
// @name        Booru Preview
// @namespace   Booru Preview
// @grant       none
// @author      Relaxeaza
// @version     1.0.0
// @include     https://gelbooru.com/index.php?page=post&s=list*
// @include     https://gelbooru.com//index.php?page=post&s=list*
// @include     https://danbooru.donmai.us/
// @include     https://danbooru.donmai.us/posts?*
// @run-at      document-idle
// ==/UserScript==

const SETTINGS = {
    HYDRUS_ENABLED: true,
    HYDRUS_URL: 'http://127.0.0.1:45869',
    HYDRUS_KEY: '146ab1723e31a2dca0348bc03576b8f7f0587d1201beb3e31a8ee0ebd85d0776'
}

let hydrus_permission = false
let preview_open = false
let $preview
let $preview_frame
let $preview_img
let $style
let cached_previews = {}
let site_preview_handler = {}
let current_preview_size = {}

function init () {
    create_styles()

    $preview = document.createElement('div')
    $preview.className = 'rlx-preview'
    $preview.style.display = 'none'
    document.body.appendChild($preview)

    $preview_frame = document.createElement('div')
    $preview_frame.className = 'rlx-preview-border'
    $preview.appendChild($preview_frame)

    document.addEventListener('keydown', function (event) {
        if (preview_open && event.key === 'Escape') {
            close_preview()
            document.removeEventListener('click', close_preview_handler)
        }
    })

    window.addEventListener('resize', function () {
        if (preview_open) {
            const size = aspect_ratio_fit(current_preview_size.width, current_preview_size.height)
            $preview_img.style.width = size.width + 'px'
            $preview_img.style.height = size.height + 'px'
        }
    })

    if (location.host in site_preview_handler) {
        if (SETTINGS.HYDRUS_ENABLED) {
            hydrus_check_permission(function (permission) {
                hydrus_permission = permission
                site_preview_handler[location.host]()
            })
        } else {
            site_preview_handler[location.host]()
        }
    }
}

function add_site (host, data) {
    if (host in site_preview_handler || typeof data !== 'function') {
        return false
    }

    site_preview_handler[host] = data
    return true
}

function open_preview (size, src, image_url) {
    if (preview_open) {
        return false
    }

    preview_open = true

    $preview_img = document.createElement('img')
    $preview_img.src = src
    $preview_img.id = 'rlx-preview-element'
    $preview_img.style.width = size.width + 'px'
    $preview_img.style.height = size.height + 'px'

    let $a = document.createElement('a')
    $a.href = image_url
    $a.appendChild($preview_img)
    $preview_frame.appendChild($a)

    $preview.style.display = 'flex'

    setTimeout(function () {
        document.addEventListener('click', close_preview_handler)
    }, 10)

    return true
}

function close_preview () {
    if (!preview_open) {
        return false
    }

    preview_open = false
    current_preview_size = {}
    $preview.style.display = 'none'
    $preview_frame.firstChild.remove()

    return true
}

function close_preview_handler (event) {
    if (event.ctrlKey || event.shiftKey) {
        return true
    }

    if (event.button !== 0) {
        return true
    }

    if (event.target.id === 'rlx-preview-element') {
        event.preventDefault()
    }

    close_preview()
    document.removeEventListener('click', close_preview_handler)
}

function aspect_ratio_fit (src_width, src_height) {
    const max_width = document.documentElement.clientWidth - 20
    const max_height = document.documentElement.clientHeight - 20
    const ratio = Math.min(max_width / src_width, max_height / src_height)

    current_preview_size.width = src_width
    current_preview_size.height = src_height
    
    return {
        width: Math.floor(src_width * ratio),
        height: Math.floor(src_height * ratio)
    }
}

function add_styles (css) {
    $style.innerHTML += css.join('')
}

function create_styles () {
    $style = document.createElement('style')
    document.head.appendChild($style)

    add_styles([
        '.rlx-preview {',
            'position: fixed;',
            'width: 100%;',
            'height: 100%;',
            'left: 0;',
            'top: 0;',
            'z-index: 100;',
            'background: #FFFFFF40;',
        '}',

        '.rlx-preview-border {',
            'background-color: #ffffff;',
            'border: 2px solid #0773fb;',
            'padding: 4px;',
            'margin: auto;',
        '}',

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

function hydrus_allowed () {
    return SETTINGS.HYDRUS_ENABLED && hydrus_permission
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

        $archor.addEventListener('click', function (event) {
            if (event.ctrlKey || event.shiftKey) {
                return true
            }

            event.preventDefault()

            const size = aspect_ratio_fit($post.dataset.width, $post.dataset.height)
            open_preview(size, $post.dataset.largeFileUrl, $archor.href)

            return false
        })

        if (hydrus_allowed()) {
            hydrus_url_exists($archor.href, function () {
                const $checked = document.createElement('div')
                $checked.className = 'rlx-hydrus-check'
                $archor.appendChild($checked)
            })
        }
    })
})

add_site('gelbooru.com', function () {
    function get_preview (post_url, callback) {
        if (post_url in cached_previews) {
            const src_width = cached_previews[post_url].width
            const src_height = cached_previews[post_url].height
            const size = aspect_ratio_fit(src_width, src_height)

            return callback(size, cached_previews[post_url].src)
        }

        ajax(post_url, function ($page) {
            const $image = $page.querySelector('#image')
            const src_width = $image.dataset.originalWidth
            const src_height = $image.dataset.originalHeight
            const size = aspect_ratio_fit(src_width, src_height)

            cached_previews[post_url] = {
                width: src_width,
                height: src_height,
                src: $image.src
            }

            callback(size, $image.src)
        }, 'html')
    }

    add_styles([
        '.rlx-hydrus-check {',
            'margin-left: -9px;',
            'margin-top: -4px;',
            'line-height: 14px;',
        '}'
    ])

    document.querySelectorAll('.thumbnail-preview a').forEach(function ($post) {
        $post.addEventListener('click', function (event) {
            if (event.ctrlKey || event.shiftKey) {
                return true
            }

            if ($post.querySelector('img').classList.contains('webm')) {
                return true
            }

            event.preventDefault()

            get_preview($post.href, function (size, src) {
                open_preview(size, src, $post.href)
            })

            return false
        })

        if (hydrus_allowed()) {
            hydrus_url_exists($post.href, function () {
                const $checked = document.createElement('div')
                $checked.className = 'rlx-hydrus-check'
                $post.appendChild($checked)
            })
        }
    })
})

add_site('safebooru.org', function () {
    function get_preview (post_url, callback) {
        if (post_url in cached_previews) {
            const src_width = cached_previews[post_url].width
            const src_height = cached_previews[post_url].height
            const size = aspect_ratio_fit(src_width, src_height)

            return callback(size, cached_previews[post_url].src)
        }

        ajax(post_url, function ($page) {
            const $image = $page.querySelector('#image')
            const src_width = $image.getAttribute('width')
            const src_height = $image.getAttribute('height')
            const size = aspect_ratio_fit(src_width, src_height)

            cached_previews[post_url] = {
                width: src_width,
                height: src_height,
                src: $image.src
            }

            callback(size, $image.src)
        }, 'html')
    }

    add_styles([
        '.rlx-hydrus-check {',
            'line-height: 14px;',
        '}'
    ])

    document.querySelectorAll('#post-list .thumb a').forEach(function ($post) {
        $post.addEventListener('click', function (event) {
            if (event.ctrlKey || event.shiftKey) {
                return true
            }

            if ($post.querySelector('img').classList.contains('webm')) {
                return true
            }

            event.preventDefault()

            get_preview($post.href, function (size, src) {
                open_preview(size, src, $post.href)
            })

            return false
        })

        if (hydrus_allowed()) {
            hydrus_url_exists($post.href, function () {
                const $checked = document.createElement('div')
                $checked.className = 'rlx-hydrus-check'
                $post.appendChild($checked)
            })
        }
    })
})

init()
