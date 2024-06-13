// ==UserScript==
// @name         de-/activate Extensions
// @namespace    http://tampermonkey.net/
// @version      1.3.4
// @description  Change the status of expensions and buildings
// @author       Silberfighter
// @include      *://www.leitstellenspiel.de/
// @include      /^https?:\/\/(?:w{3}\.)?(?:polizei\.)?leitstellenspiel\.de\/$/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @require      https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/HelperMethods.js
// @require      https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/UTF16Converter.js
// @grant        GM_addStyle
// ==/UserScript==
/* global $ */

(async function() {

    createOrAssigneDropdownmenu("changeActiveExtensions", "change active Extensions", showOwnCustomOverlay);

    //if (!sessionStorage.c2Buildings || JSON.parse(sessionStorage.c2Buildings).lastUpdate < (new Date().getTime() - 5 * 1000 * 60) || JSON.parse(sessionStorage.c2Buildings).userId != user_id) {
    //    await $.getJSON('/api/buildings').done(data => sessionStorage.setItem('c2Buildings', JSON.stringify({ lastUpdate: new Date().getTime(), value: LZString.compress(JSON.stringify(data)), userId: user_id })));
    //}
    //fetch('https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/buildingData.json').then((response) => response.text()).then((text) => console.log(text));
    //const buildingData = await $.getJSON("https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/buildingData.json");

    const response = await fetch("https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/buildingData.json");
    const buildingData = JSON.parse(await response.text());


    let baseID = "extensionsToggle";

    // Create the overlay container
    var overlayContainer = document.createElement('div');
    overlayContainer.id = baseID + '-overlay-container';
    document.body.appendChild(overlayContainer);

    // Create the overlay content
    var overlayContent = document.createElement('div');
    overlayContent.id = baseID + '-overlay-content';
    overlayContent.className = "modal-content";
    overlayContainer.appendChild(overlayContent);

    /*    // Create the close button
    var closeButton = document.createElement('button');
    closeButton.className = "close";
    closeButton.setAttribute("type","button");
    closeButton.innerHTML = `<span aria-hidden="true">×</span>`;
    closeButton.addEventListener('click', hideOwnCustomOverlay);
    overlayContent.appendChild(closeButton);*/

    // Customize the overlay styles
    GM_addStyle(`
        #`+baseID+`-overlay-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
        }

        #`+baseID+`-overlay-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
            border-radius: 5px;
            height: 650px;
            width: 650px;
            overflow-y: auto;
        }
    `);


    // Function to show the overlay
    async function showOwnCustomOverlay() {
        document.getElementById(baseID + "-overlay-container").style.display = 'block';

        document.getElementById(baseID + "WaitMessage").className = "";

        if (!sessionStorage.c2Buildings || JSON.parse(sessionStorage.c2Buildings).lastUpdate < (new Date().getTime() - 5 * 1000 * 60) || JSON.parse(sessionStorage.c2Buildings).userId != user_id) {
            dropdown.value = -1;
            addExtensionsToList(undefined);
            await $.getJSON('/api/buildings').done(data => sessionStorage.setItem('c2Buildings', JSON.stringify({ lastUpdate: new Date().getTime(), value: LZString.compress(JSON.stringify(data)), userId: user_id })));
        }

        document.getElementById(baseID + "WaitMessage").className = "hidden";
    }

    // Function to hide the overlay
    function hideOwnCustomOverlay() {
        document.getElementById(baseID + "-overlay-container").style.display = 'none';
    }



    // Add event listener to toggle the overlay on click
    overlayContainer.addEventListener('click', function(event) {
        if (event.target === overlayContainer) {
            overlayContainer.style.display = 'none';
            //event.stopPropagation(); // Prevent the click event from propagating to underlying elements
        }
    });


    const relevantBuildingsID = [0,2,4,5,6,9,11,12,13,15,17,21,24,25];
    const extensionsToIgnore = ["Abrollbehälter-Stellplatz", "Großwache", "Zelle"];

    overlayContent.innerHTML += `
        <div class="overlay-header" id="`+baseID+`OverlayHeader">
        <div style={text-align: left;}>
            <h1 id="`+baseID+`WaitMessage" class="hidden" style="color:red;"><center>BITTE WARTEN, Daten laden</center></h1>
            <h3><center>Gebäudeerweiterungen de-/aktivieren</center></h3>
            <h5><center>NICHT mehrere Erweiterungen gleichzeitig de-/aktivieren. Immer nur eine zur selben Zeit</center></h5>
            <h5>Schließe dieses Pop-Up und öffne es in 5 Minuten erneut, falls eines der folgenden Punkte in den letzten 5 Minuten passiert ist:</br>
            - ein Gebäude/Erweiterunge wurde gebaut/geändert</br>
            - der letzte Vorgang in diesem Pop-Up wurde vor dem Erscheinen von "Fertig" abgebrochen</br>
            Andernfalls kann es passieren, dass das Skript nicht den neuesten Gebäudestand berücksichtigt. </h5>
        </div>
        </div>
        <div class="overlay-body" id="`+baseID+`OverlayBody">
        </div>
    `;


    // Create the dropdown menu
    let dropdown = document.createElement('select');
    dropdown.id = baseID + '-overlay-dropdown';
    document.getElementById(baseID + "OverlayHeader").appendChild(dropdown);

    // Add options to the dropdown menu
    for (var i = 0; i < buildingData.length; i++) {
        if(relevantBuildingsID.indexOf(buildingData[i].id) >= 0){
            var option = document.createElement('option');
            option.textContent = buildingData[i].name;
            option.value = buildingData[i].id;
            dropdown.appendChild(option);
        }
    }

    dropdown.value = -1;

    // Add event listener to the dropdown menu when its value changes
    dropdown.addEventListener('change', function(event) {
        var selectedValue = event.target.value;
        var selectedBuilding = buildingData.filter(e => e.id == selectedValue)[0];
        addExtensionsToList(selectedBuilding);
        // Perform desired actions based on the selected value
    });

    delete dropdown;


    function addExtensionsToList(relevantBuilding){
        document.getElementById(baseID + "OverlayBody").innerHTML = "";

        if(relevantBuilding == undefined){
            return;
        }

        let relevantExtensions = relevantBuilding.extensions;
        let buildingIDs = getRelevantBuildingID(relevantBuilding.id);

        let allRelevantBuildings = JSON.parse(LZString.decompress(JSON.parse(sessionStorage.c2Buildings).value)).filter(e => buildingIDs.indexOf(e.building_type) >= 0);


        let activ = allRelevantBuildings.filter(e => e.enabled == true);
        let deactiv = allRelevantBuildings.filter(e => e.enabled == false);

        document.getElementById(baseID + "OverlayBody").innerHTML += `
            <div class="panel panel-default">
                <div class="panel-heading">
                    `+ allRelevantBuildings.length+` Gebäude gebaut
                </div>
                <div class="panel-body">
                    <div  style="margin-top:1em">
                        <div id="labelActivateBuilding" style="display:inline;">`+activ.length+` aktiviert</div>
                        <a id="activateBuilding" class="btn btn-success btn-xs building_clicked" building_id="${ relevantBuilding.id }" shouldActivate=true>alle aktivieren</a>
                    </div>
                    <div>
                        <div id="labelDeactivateBuilding" style="display:inline;">`+deactiv.length+` deaktiviert</div>
                        <a id="deactivateBuilding" class="btn btn-danger btn-xs building_clicked" building_id="${ relevantBuilding.id }" shouldActivate=false>alle deaktivieren</a>
                    </div>
                    <div class="progress hidden" style="margin-top:1em">
                        <div id="pgBuildings" class="progress-bar progress-bar-info" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="0" style="width: 0%;color: black"></div>
                    </div>
                </div>
            </div>`

        for (var i = 0; i < relevantExtensions.length; i++) {
            if(extensionsToIgnore.indexOf(relevantExtensions[i].name) == -1){
                let option = document.createElement('div');
                option.innerHTML = relevantExtensions[i].name;

                let buildingsWithExtension = allRelevantBuildings.filter(e => e.extensions.filter(exten => exten.type_id == relevantExtensions[i].id && exten.available).length > 0);
                let activ = allRelevantBuildings.filter(e => e.extensions.filter(exten => exten.type_id == relevantExtensions[i].id && exten.available && exten.enabled == true).length > 0);
                let deactiv = allRelevantBuildings.filter(e => e.extensions.filter(exten => exten.type_id == relevantExtensions[i].id && exten.available && exten.enabled == false).length > 0);

                option =
                    `<div class="panel panel-default">
                         <div class="panel-heading">
                             <h5>`+ relevantExtensions[i].name+`</h5>
                         </div>
                         <div class="panel-body">
                             <div>
                                 `+buildingsWithExtension.length+` mal gebaut, davon:
                             </div>
                             <div  style="margin-top:1em">
                                 <div id="labelActivate`+relevantExtensions[i].id+`" style="display:inline;">`+activ.length+` aktiviert</div>
                                 <a id="activate`+relevantExtensions[i].id+`" class="btn btn-success btn-xs extension_clicked" building_id="${ relevantBuilding.id }" extension_id="${ relevantExtensions[i].id }" shouldActivate=true>alle aktivieren</a>
                             </div>
                             <div>
                                 <div id="labelDeactivate`+relevantExtensions[i].id+`" style="display:inline;">`+deactiv.length+` deaktiviert</div>
                                 <a id="deactivate`+relevantExtensions[i].id+`" class="btn btn-danger btn-xs extension_clicked" building_id="${ relevantBuilding.id }" extension_id="${ relevantExtensions[i].id }" shouldActivate=false>alle deaktivieren</a>
                             </div>
                             <div class="progress hidden" style="margin-top:1em">
                                 <div id="pgExtension${ relevantExtensions[i].id }" class="progress-bar progress-bar-info" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="0" style="width: 0%;color: black"></div>
                             </div>
                         </div>
                     </div>`;

                document.getElementById(baseID + "OverlayBody").innerHTML += option;
            }
        }

        // Add event listener to each element
        document.querySelectorAll('.building_clicked').forEach(function(element) {
            element.addEventListener('click', function() {
                deActiveateBuilding(element);
            });
        });

        // Add event listener to each element
        document.querySelectorAll('.extension_clicked').forEach(function(element) {
            element.addEventListener('click', function() {
                deActiveateExtensions(element);
            });
        });
    }


    async function deActiveateBuilding(clickedButton){
        let buildings = JSON.parse(LZString.decompress(JSON.parse(sessionStorage.c2Buildings).value));

        let buildingsID = getRelevantBuildingID(clickedButton.getAttribute("building_id"));
        let activateBuilding = clickedButton.getAttribute("shouldActivate") === 'true';

        //console.log(buildingsID);


        let allRelevantBuildings = buildings.filter(e => buildingsID.indexOf(e.building_type) >= 0 && e.enabled != activateBuilding);

        document.getElementById("pgBuildings").setAttribute("aria-valuemax", allRelevantBuildings.length);
        document.getElementById("pgBuildings").parentNode.className = "progress";
        document.getElementById("pgBuildings").innerHTML="";

        //console.log(allRelevantBuildings);

        for(let i = 0; i < allRelevantBuildings.length; i++){

            //await $.post("/buildings/" + allRelevantBuildings[i].id + "/active");
            // GET Request using fetch
            await fetch("/buildings/" + allRelevantBuildings[i].id + "/active")
                .then(response => {
                //console.log(response);

                if (!response.ok) {
                    //throw new Error('Network response was not ok');
                }
                return response; // Parse the response data as JSON
            })
                .then(data => {
                // Code to execute when the fetch is successful
            })
                .catch(error => {
                // Code to handle errors or failed fetch
                //ANMERKUNG: Trotz Fehlermeldung hat er die Einsatzbereitschaft geändert. Daher werden auftretende Fehler ignoriert
            });

            document.getElementById("pgBuildings").setAttribute("aria-valuenow", i + 1);
            document.getElementById("pgBuildings").style.width = ((i + 1)/allRelevantBuildings.length*100) + "%";

            await delay(50);
        }


        let allRelevantBuildingsID = allRelevantBuildings.map(e => e.id);

        for(let i = 0; i < buildings.length; i++){
            if(allRelevantBuildingsID.indexOf(Number(buildings[i].id)) >= 0){
                buildings[i].enabled = activateBuilding;
            }
        }


        sessionStorage.setItem('c2Buildings', JSON.stringify({ lastUpdate: JSON.parse(sessionStorage.c2Buildings).lastUpdate, value: LZString.compress(JSON.stringify(buildings)), userId: JSON.parse(sessionStorage.c2Buildings).userId }));

        let allUpdatedBuildings = buildings.filter(e => buildingsID.indexOf(e.building_type) >= 0);
        let allActiveUpdatedBuildings = allUpdatedBuildings.filter(e => e.enabled == true);
        let allDeactiveUpdatedBuildings = allUpdatedBuildings.filter(e => e.enabled == false);
        document.getElementById("labelActivateBuilding").innerHTML = allActiveUpdatedBuildings.length + " aktiviert";
        document.getElementById("labelDeactivateBuilding").innerHTML = allDeactiveUpdatedBuildings.length + " deaktiviert";

        document.getElementById("pgBuildings").innerHTML="FERTIG";
    }


    async function deActiveateExtensions(clickedButton){
        let buildings = JSON.parse(LZString.decompress(JSON.parse(sessionStorage.c2Buildings).value));

        let buildingsID = getRelevantBuildingID(clickedButton.getAttribute("building_id"));
        let extensionID = clickedButton.getAttribute("extension_id");
        let activateExtensions = clickedButton.getAttribute("shouldActivate") === 'true';

        //console.log(buildingsID);


        let allRelevantBuildings = buildings.filter(e => buildingsID.indexOf(e.building_type) >= 0 && e.extensions.filter(exten => exten.type_id == extensionID && exten.available && exten.enabled != activateExtensions).length > 0);

        document.getElementById("pgExtension"+extensionID).setAttribute("aria-valuemax", allRelevantBuildings.length);
        document.getElementById("pgExtension"+extensionID).parentNode.className = "progress";
        document.getElementById("pgExtension"+extensionID).innerHTML="";

        //console.log(allRelevantBuildings);

        for(let i = 0; i < allRelevantBuildings.length; i++){

            //await $.post("/buildings/" + allRelevantBuildings[i].id + "/extension_ready/" + extensionID + "/" + allRelevantBuildings[i].id);
            // POST Request using fetch
            await fetch("/buildings/" + allRelevantBuildings[i].id + "/extension_ready/" + extensionID + "/" + allRelevantBuildings[i].id, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: encodeFormData({
                    "_method": "post",
                    "authenticity_token": $("meta[name=csrf-token]").attr("content")
                })
            })
                .then(response => {
                //console.log(response);

                if (!response.ok) {
                    //throw new Error('Network response was not ok');
                }
                return response; // Parse the response data as JSON
            })
                .then(data => {
                // Code to execute when the fetch is successful
                //buildings.find(e => e.id == allRelevantBuildings[i].id).extensions.find(exten => exten.type_id == extensionID).enabled = activateExtensions;
            })
                .catch(error => {
                // Code to handle errors or failed fetch
                //ANMERKUNG: Trotz Fehlermeldung hat er die Einsatzbereitschaft geändert. Daher werden auftretende Fehler ignoriert
            });

            document.getElementById("pgExtension"+extensionID).setAttribute("aria-valuenow", (i + 1));
            document.getElementById("pgExtension"+extensionID).style.width = ((i + 1)/allRelevantBuildings.length*100) + "%";

            await delay(50);
        }


        let allRelevantBuildingsID = allRelevantBuildings.map(e => e.id);

        for(let i = 0; i < buildings.length; i++){
            if(allRelevantBuildingsID.indexOf(Number(buildings[i].id)) >= 0){
                for(let n = 0; n < buildings[i].extensions.length; n++){
                    if(buildings[i].extensions[n].type_id == extensionID){
                        buildings[i].extensions[n].enabled = activateExtensions;
                    }
                }
            }
        }


        sessionStorage.setItem('c2Buildings', JSON.stringify({ lastUpdate: JSON.parse(sessionStorage.c2Buildings).lastUpdate, value: LZString.compress(JSON.stringify(buildings)), userId: JSON.parse(sessionStorage.c2Buildings).userId }));

        let allUpdatedBuildings = buildings.filter(e => buildingsID.indexOf(e.building_type) >= 0);
        let allActiveUpdatedBuildings = allUpdatedBuildings.filter(e => e.extensions.filter(exten => exten.type_id == extensionID && exten.available && exten.enabled == true).length > 0);
        let allDeactiveUpdatedBuildings = allUpdatedBuildings.filter(e => e.extensions.filter(exten => exten.type_id == extensionID && exten.available && exten.enabled == false).length > 0);
        document.getElementById("labelActivate"+extensionID).innerHTML = allActiveUpdatedBuildings.length + " aktiviert";
        document.getElementById("labelDeactivate"+extensionID).innerHTML = allDeactiveUpdatedBuildings.length + " deaktiviert";

        document.getElementById("pgExtension"+extensionID).innerHTML="FERTIG";
    }

    //sorgt dafür, dass auch die entsprechenden Kleinwachen mit berücksichtigt werden
    function getRelevantBuildingID(relevantBuildingID){
        relevantBuildingID = Number(relevantBuildingID);

        if(relevantBuildingID == 0){
            return [0,18];
        }

        if(relevantBuildingID == 6){
            return [6,19];
        }

        if(relevantBuildingID == 2){
            return [2,20];
        }

        return [relevantBuildingID];
    }

    // Function to convert an object to x-www-form-urlencoded format
    function encodeFormData(data) {
        return Object.keys(data)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
            .join('&');
    }

})();
