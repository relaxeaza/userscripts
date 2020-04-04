// ==UserScript==
// @name        Sauce Easy Drop
// @namespace   Sauce Easy Drop
// @match       https://saucenao.com/*
// @match       https://iqdb.org/*
// @grant       none
// @version     1.0.0
// @author      Relaxeaza
// @description SauceNAO/IQDB - Drop files in any place of the window to get sauce.
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
