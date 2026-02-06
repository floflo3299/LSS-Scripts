// ==UserScript==
// @name         Lehrgangsübersicht zusammenfassen
// @namespace    http://tampermonkey.net/
// @version      2026-02-06
// @description  fasst die Lehrgänge in der Lehrgangsübersicht zusammen
// @author       Silberfighter
// @match        https://www.leitstellenspiel.de/schoolings
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const originalTable = document.getElementById("schooling_own_table");
    if (!originalTable) return;

    const tbody = originalTable.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr[data-education-key]"));

    // 1) Gruppieren (empfohlen: data-education-key, weil stabil)
    let groups = new Map();
    rows.forEach(tr => {
        const key = tr.getAttribute("data-education-key") || "unknown";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(tr);
    });


    groups = [...groups.entries()]
    groups.sort((a, b) => {
        if (getTitleFromRow(a[1][0]) < getTitleFromRow(b[1][0])) {
            return -1;
        } else {
            return 1;
        }
    });

    groups = new Map(groups);



    // 2) Summary-Tabelle bauen
    const newDiv = document.createElement("div");
    newDiv.id = "schooling_summary_wrap"
    originalTable.parentElement.insertBefore(newDiv, originalTable);

    newDiv.innerHTML = `
      <a class="btn btn-success" id="btn_show_all_schoolings">Zeige alle ${rows.length} Lehrgänge</a>
      <table class="table table-striped" id="schooling_summary_table">
        <thead>
          <tr>
            <th>Ausbildung</th>
            <th>Anzahl Lehrgänge</th>
            <th>Veranstalter</th>
          </tr>
        </thead>
        <tbody id="schooling_summary_table_body"></tbody>
      </table>
    `;


    document.getElementById("btn_show_all_schoolings").addEventListener("click", () => {hideAll(areAllSchoolingsDisplayed());});


    hideAll(true);

    function getTitleFromRow(tr) {
        const firstTd = tr.querySelector("td");
        // bevorzugt sortvalue; fällt sonst auf Link/Text zurück
        const sv = firstTd?.getAttribute("sortvalue");
        if (sv) return sv;
        const a = firstTd?.querySelector("a");
        return (a ? a.textContent : firstTd?.textContent || "Unbekannt").trim();
    }

    Array.from(groups.entries()).forEach(([key, trs], idx) => {
        const title = getTitleFromRow(trs[0]);
        const count = trs.length;
        let veranstalter = trs.map((x) => {
            return x.children[2].innerText.trim();
        });



        let veranstalter_count = new Map();
        veranstalter.forEach(name => {
            if (!veranstalter_count.has(name)) veranstalter_count.set(name, 0);
            veranstalter_count.set(name, veranstalter_count.get(name) + 1);
        });

        veranstalter_count = [...veranstalter_count.entries()]
        veranstalter_count.sort((a, b) => {
            if (a[0] < b[0]) {
                return -1;
            } else {
                return 1;
            }
        });


        let text_veranstalter = ``;
        for(let x = 0; x < veranstalter_count.length; x++){
            text_veranstalter += `${veranstalter_count[x][1]}-mal ${veranstalter_count[x][0]}`
            if(x < veranstalter_count.length - 1) text_veranstalter += `<br>`
        }

        const summaryTr = document.createElement("tr");
        summaryTr.style.cursor = "pointer";
        summaryTr.setAttribute("data-education-key", trs[0].getAttribute("data-education-key"));
        summaryTr.innerHTML = `
          <td><strong>${escapeHtml(title)}</strong></td>
          <td>${count}</td>
          <td>${text_veranstalter}</td>`


        summaryTr.addEventListener("click", clickedOnElement);


        document.getElementById("schooling_summary_table_body").appendChild(summaryTr);


    });


    function clickedOnElement(evt){
        let relevantOpened = false;
        let irrelevantOpened = true;

        rows.forEach(r => {
            if(r.getAttribute("data-education-key") == evt.currentTarget.getAttribute("data-education-key")){
                if(r.className == ""){
                    relevantOpened = true;
                }

                r.className = "";
            }else{
                if(r.className == "hidden"){
                    irrelevantOpened = false;
                }

                r.className = "hidden";
            }
        });

        if(relevantOpened && !irrelevantOpened){
            hideAll(true);
        }
    }


    function hideAll(shouldHide){
        rows.forEach(r => {
            if(shouldHide){
                r.className = "hidden";
            } else {
                r.className = "";
            }
        });
    }


    function areAllSchoolingsDisplayed(){
        let returnVal = true;
        rows.forEach(r => {
            if(r.className == "hidden"){
                returnVal = false;
            }
        });

        return returnVal;
    }


    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, s => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[s]));
    }

})();
