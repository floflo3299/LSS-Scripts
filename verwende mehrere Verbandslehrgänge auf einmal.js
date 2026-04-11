// ==UserScript==
// @name         verwende mehrere Verbandslehrgänge auf einmal
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  mit diesem Skript können mehrere Verbandslehrgänge auf einmal belegt werden
// @author       Silberfighter
// @match        https://www.leitstellenspiel.de/schoolings/*
// @match        https://www.leitstellenspiel.de/schoolings
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// ==/UserScript==


const TARGET_URL = 'https://www.leitstellenspiel.de/schoolings';
const HTML_KEY = 'opened_page_html';
const REQUEST_KEY = 'opened_page_request';


(function () {
    'use strict';

    // -------- Part 1: run on the start page --------
    if (location.href.includes('https://www.leitstellenspiel.de/schoolings/')) {

        const btnTrain = document.querySelectorAll('nav div.container-fluid div.navbar-header input')[0];

        //'<input class="btn btn-success navbar-btn" id="ausbilden_via_verband" value="Ausbilden \nüber Verband">'
        let newBtn = document.createElement('a');
        newBtn.className = "btn btn-success navbar-btn";
        newBtn.id = "ausbilden_via_verband";
        newBtn.type = "button"
        newBtn.innerHTML = 'Ausbilden<br>über Verband';

        btnTrain.parentNode.insertBefore(newBtn, btnTrain.nextSibling);

        $('#ausbilden_via_verband').on('click', function() { train_Via_Verband(); });

    }

    // -------- Part 2: run on the target page --------
    if (location.href.includes('https://www.leitstellenspiel.de/schoolings#tm_request=')) {
        const hash = new URL(location.href).hash;
        const match = hash.match(/tm_request=([^&]+)/);
        if (!match) return;

        const requestId = match[1];

        setTimeout(() => {
            const html = document.documentElement.outerHTML;
            GM_setValue(HTML_KEY, html ? html : null);

            window.close();
        }, 2000);
    }
})();


async function train_Via_Verband() {
    GM_addValueChangeListener(HTML_KEY, async function (name, oldValue, newValue, remote) {
        if (!newValue) return;

        console.log('Received HTML from opened page:');

        // make a new parser
        const parser = new DOMParser();
        newValue = parser.parseFromString(newValue, "text/html");

        const schooling_title = document.querySelectorAll('h2')

        let ids = getSchoolingIdsByLehrgang(schooling_title[0].innerText, newValue);
        console.log(ids);


        let people_to_train = Array.from(
            document.querySelectorAll('input.schooling_checkbox')
        )
        .filter(row => row.checked)
        .map(row => row.value);

        for (let n = 0; n < ids.length; n++){
            console.log(ids[n].id);
            console.log(people_to_train.slice(0, ids[n].freiePlaetze));


            await $.post("https://www.leitstellenspiel.de/schoolings/"+ ids[n].id +"/education", {"_method": "post", "authenticity_token": $("meta[name=csrf-token]").attr("content"), "personal_ids": people_to_train.slice(0, ids[n].freiePlaetze)});


            for (let i = 0; i < ids[n].freiePlaetze; i++){
                people_to_train.shift();
            }

            if(people_to_train.length == 0){
                break;
            }
        }

        location.reload();
    });

    // signal request id so the target page knows this open was intentional
    const requestId = Date.now().toString();
    GM_setValue(REQUEST_KEY, requestId);

    GM_openInTab(`${TARGET_URL}#tm_request=${requestId}`, {
        active: true,
        insert: true,
        setParent: true
    });
}


function getSchoolingIdsByLehrgang(lehrgangName, pageHTML) {

    let tableWithLehrgaenge = pageHTML.getElementById("schooling_opened_table");

    if (!tableWithLehrgaenge){
        return [];
    }

    return Array.from(
        tableWithLehrgaenge.querySelectorAll('#schooling_opened_table tbody tr.schooling_opened_table_searchable')
    )
        .filter(row => row.getAttribute('search_attribute')?.trim() === lehrgangName)
        .map(row => {
        const timerCell = row.querySelector('td.schooling-timer');
        const freiePlaetzeCell = row.children[1]; // 2. Spalte = Freie Plätze

        const fullId = timerCell?.id || null; // z.B. education_schooling_34238638
        const idMatch = fullId?.match(/\d+$/);

        return {
            lehrgang: row.getAttribute('search_attribute')?.trim() || null,
            id: idMatch ? idMatch[0] : null,
            freiePlaetze: freiePlaetzeCell
            ? parseInt(freiePlaetzeCell.textContent.trim(), 10)
            : null
        };
    });
}
