// ==UserScript==
// @name        Booru Quick Preview
// @description Preview media without opening the post page.
// @namespace   relaxeaza/userscripts
// @version     1.0.0
// @grant       none
// @run-at      document-start
// @icon        https://i.imgur.com/pi2aL2k.jpg
// @include     https://gelbooru.com/index.php?page=post&s=list*
// @include     https://gelbooru.com//index.php?page=post&s=list*
// @include     https://danbooru.donmai.us/
// @include     https://danbooru.donmai.us/posts?*
// @include     https://safebooru.org/index.php?page=post&s=list*
// @downloadURL https://gitlab.com/relaxeaza/userscripts/raw/master/booru-quick-preview.user.js
// ==/UserScript==

let preview_open = false
let $preview
let $preview_frame
let $preview_media
let $style
let cached_previews = {}
let site_preview_handler = {}
let current_preview_size = {}
let video_width
let video_height

function init () {
    create_styles()

    document.addEventListener('keydown', function (event) {
        if (preview_open && event.key === 'Escape') {
            close_preview()
            document.removeEventListener('click', close_preview_handler)
        }
    })

    window.addEventListener('resize', function () {
        video_width = Math.round(document.documentElement.clientWidth / 100 * 75)
        video_height = Math.round(document.documentElement.clientHeight / 100 * 75)

        if (preview_open) {
            const size = aspect_ratio_fit(current_preview_size.width, current_preview_size.height)
            $preview_media.style.width = size.width + 'px'
            $preview_media.style.height = size.height + 'px'
        }
    })

    $preview = document.createElement('div')
    $preview.className = 'rlx-preview'
    $preview.style.display = 'none'
    document.body.appendChild($preview)

    $preview_frame = document.createElement('div')
    $preview_frame.className = 'rlx-preview-border'
    $preview.appendChild($preview_frame)

    video_width = Math.round(document.documentElement.clientWidth / 100 * 75)
    video_height = Math.round(document.documentElement.clientHeight / 100 * 75)

    if (location.host in site_preview_handler) {
        site_preview_handler[location.host]()
    }
}

function add_site (host, data) {
    if (host in site_preview_handler || typeof data !== 'function') {
        return false
    }

    site_preview_handler[host] = data
    return true
}

function open_preview (size, src, is_video, image_url) {
    if (preview_open) {
        return false
    }

    preview_open = true

    if (is_video) {
        $preview_media = document.createElement('video')

        src = Array.isArray(src) ? src : [src]
        src.forEach(function (srcUrl) {
            let $src = document.createElement('source')
            $src.src = srcUrl
            $preview_media.appendChild($src)
        })

        $preview_media.autoplay = true
        $preview_media.controls = true
        $preview_media.loop = true
        $preview_media.setAttribute('width', size.width)
        $preview_media.setAttribute('height', size.height)
    } else {
        $preview_media = document.createElement('img')
        $preview_media.src = src
        $preview_media.style.width = size.width + 'px'
        $preview_media.style.height = size.height + 'px'
    }

    $preview_media.id = 'rlx-preview-element'

    let $a = document.createElement('a')
    $a.href = image_url
    $a.appendChild($preview_media)
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
        width: parseInt(Math.floor(src_width * ratio), 10),
        height: parseInt(Math.floor(src_height * ratio), 10)
    }
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
        '}'
    ])
}

function add_styles (css) {
    $style.innerHTML += css.join('')
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

add_site('danbooru.donmai.us', function () {
    document.querySelectorAll('#posts-container article').forEach(function ($post) {
        const $archor = $post.querySelector('a')

        $archor.addEventListener('click', function (event) {
            if (event.ctrlKey || event.shiftKey) {
                return true
            }

            event.preventDefault()

            const is_video = /mp4|webm/.test($post.dataset.fileExt)
            const size = aspect_ratio_fit($post.dataset.width, $post.dataset.height)

            open_preview(size, $post.dataset.largeFileUrl, is_video, $archor.href)

            return false
        })
    })
})

add_site('gelbooru.com', function () {
    function get_preview (post_url, is_video, callback) {
        if (post_url in cached_previews) {
            const size = aspect_ratio_fit(
                cached_previews[post_url].width,
                cached_previews[post_url].height
            )

            return callback(size, cached_previews[post_url].src)
        }

        ajax(post_url, function ($page) {
            cached_previews[post_url] = {}

            let $media

            if (is_video) {
                $media = $page.querySelector('#gelcomVideoPlayer')

                let $size = $page.querySelectorAll('#tag-list div li:not([class])')[2]
                let size = $size.innerText.split(' ')[1].split('x')

                cached_previews[post_url].width = parseInt(size[0], 10)
                cached_previews[post_url].height = parseInt(size[1], 10)
                cached_previews[post_url].is_video = true
                cached_previews[post_url].src = []

                $media.querySelectorAll('source').forEach(function (source) {
                    cached_previews[post_url].src.push(source.src)
                })
            } else {
                $media = $page.querySelector('#image')

                cached_previews[post_url].width = parseInt($media.dataset.originalWidth, 10)
                cached_previews[post_url].height = parseInt($media.dataset.originalHeight, 10)
                cached_previews[post_url].src = $media.src
            }

            const size = aspect_ratio_fit(
                cached_previews[post_url].width, 
                cached_previews[post_url].height
            )

            callback(size, cached_previews[post_url].src)
        }, 'html')
    }

    document.querySelectorAll('.thumbnail-preview a').forEach(function ($post) {
        $post.addEventListener('click', function (event) {
            if (event.ctrlKey || event.shiftKey) {
                return true
            }

            event.preventDefault()
            
            const is_video = $post.querySelector('img').classList.contains('webm')

            get_preview($post.href, is_video, function (size, src) {
                open_preview(size, src, is_video, $post.href)
            })

            return false
        })
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
                open_preview(size, src, false, $post.href)
            })

            return false
        })
    })
})

document.addEventListener('DOMContentLoaded', init)
