// ==UserScript==
// @name         PersonalToBePol
// @version      1.0.2
// @description  transfer personal from police stations to BePol
// @author       Silberfighter
// @include      https://www.leitstellenspiel.de/buildings/*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @require      https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/UTF16Converter.js
// @namespace    empty
// ==/UserScript==

(async function() {
    'use strict';

    if (!sessionStorage.c2Buildings || JSON.parse(sessionStorage.c2Buildings).lastUpdate < (new Date().getTime() - 5 * 1000 * 60) || JSON.parse(sessionStorage.c2Buildings).userId != user_id) {
        await $.getJSON('/api/buildings').done(data => sessionStorage.setItem('c2Buildings', JSON.stringify({ lastUpdate: new Date().getTime(), value: LZString.compressToUTF16(JSON.stringify(data)), userId: user_id })));
    }
    var cBuildings = JSON.parse(LZString.decompress(JSON.parse(sessionStorage.c2Buildings).value));

    var buildingID = (window.location.href.split("/")[4]).replace("#", "");
    var building = cBuildings.filter(b => b.id == buildingID)[0];

    if (building.building_type == 11 && window.location.href == "https://www.leitstellenspiel.de/buildings/" + buildingID + "/hire"){

        var newWindow = document.createElement("div");
        newWindow.innerHTML = `
            <div>
                <p style="display: inline-block">Personal pro Wache:</p>
                <input style="display:inline-block; color: #000; width:50px;" type="number" id="maxPerBuilding" min="1" value="1"></input>
                <a id="btnAutoSelect" class="btn btn-success">Auswählen</a>
                <input id="noEduc" name="noEduc" type="checkbox" checked="true">
                <label class="" for="noEduc">nur Personal ohne Ausbildung</label>
                <input id="noAss" name="noAss" type="checkbox" checked="true">
                <label class="" for="noAss">nur ungebundenes Personal</label>
            </div>
        `;

        newWindow.style.padding = "15px 5px 15px 5px";

        
        let titleDiv = Array.from(document.getElementsByTagName("h2"));
        //titleDiv = titleDiv.filter(e => e.getAttribute("building_type") != undefined);
        titleDiv = titleDiv[0];
        titleDiv.parentNode.parentNode.insertBefore(newWindow, titleDiv.parentNode.nextSibling);


        $('#btnAutoSelect').on('click', function() {
            var allBuildings = Array.prototype.slice.call(document.getElementsByClassName("table table-striped tablesorter tablesorter-default"));

            allBuildings = allBuildings.filter(item => new String(item.parentElement.className).valueOf() != new String("panel-body hidden").valueOf());

            allBuildings.forEach(item => {
                var allPeople = Array.prototype.slice.call(item.getElementsByTagName("tr"));
                allPeople.shift();

                var curSelected = 0;
                for (let i = 0; i < allPeople.length; i++) {
                    if(IsPeopleAvailable(allPeople[i]) && IsPeopleSelected(allPeople[i])){
                        curSelected += 1;
                    }

                    if(IsPeopleAvailable(allPeople[i]) && IsPeopleSelected(allPeople[i]) && ((document.getElementById("noEduc").checked && HasPeopleASTraining(allPeople[i])) || (document.getElementById("noAss").checked && IsPeopleGebunden(allPeople[i])))){
                        UnselectPeople(allPeople[i]);
                        curSelected -= 1;
                    }
                }

                var maxPerBuilding = $('#maxPerBuilding').val();

                for (let i = 0; i < allPeople.length; i++) {
                    if(curSelected < maxPerBuilding && IsPeopleAvailable(allPeople[i]) && !IsPeopleSelected(allPeople[i]) && (!document.getElementById("noEduc").checked || !HasPeopleASTraining(allPeople[i])) && (!document.getElementById("noAss").checked || !IsPeopleGebunden(allPeople[i]))){
                        SelectPeople(allPeople[i]);
                        curSelected += 1;
                    }

                    if(curSelected > maxPerBuilding && IsPeopleAvailable(allPeople[i]) && IsPeopleSelected(allPeople[i])){
                        UnselectPeople(allPeople[i]);
                        curSelected -= 1;
                    }
                }
            });

        });
    }

    function IsPeopleSelected(entry){
        return entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked;
    }

    function SelectPeople(entry){
        if (!entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked){
            entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].click()
        }
    }

    function UnselectPeople(entry){
        if (entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked){
            entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].click()
        }
    }

    function IsPeopleAvailable(entry){
        return new String(entry.getElementsByTagName("td")[0].innerHTML).valueOf().trim() != new String("").valueOf();
    }

    function HasPeopleASTraining(entry){
        return new String(entry.getElementsByTagName("td")[2].innerHTML).valueOf().trim() != new String("").valueOf();
    }

    function IsPeopleGebunden(entry){
        return new String(entry.getElementsByTagName("td")[3].innerHTML).valueOf().trim() != new String("").valueOf();
    }
})();
