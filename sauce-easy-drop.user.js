// ==UserScript==
// @name        Sauce Easy Drop
// @description SauceNAO/IQDB - Drop files in any place of the window to get sauce.
// @namespace   relaxeaza/userscripts
// @version     1.0.0
// @grant       none
// @run-at      document-start
// @icon        https://i.imgur.com/7bSVRPU.jpg
// @include     https://saucenao.com/*
// @include     https://iqdb.org/*
// @downloadURL https://gitlab.com/relaxeaza/userscripts/raw/master/sauce-easy-drop.user.js
// ==/UserScript==

const sites = {
    'iqdb.org': {
        form_action: '/',
        input_name: 'file'
    },
    'saucenao.com': {
        form_action: 'search.php',
        input_name: 'file'
    }
}

function create_form () {
    let $form = document.createElement('form')
    $form.action = sites[location.host].form_action
    $form.method = 'post'
    $form.enctype = 'multipart/form-data'
    $form.style.display = 'none'
    $form.id = 'relax-form'

    let $input = document.createElement('input')
    $input.type = 'file'
    $input.name = sites[location.host].input_name
    $input.id = 'relax-input'

    $form.appendChild($input)
    document.body.appendChild($form)
}

function ignore (event) {
    event.preventDefault()
    event.stopPropagation()
}

create_form()

let $form = document.querySelector('#relax-form')
let $input = document.querySelector('#relax-input')

;['dragover', 'dragleave', 'drop'].forEach(function (eventName) {
    document.body.addEventListener(eventName, ignore, false)
})

document.body.addEventListener('drop', function (event) {
    $input.files = event.dataTransfer.files
    $form.submit()
}, false)
