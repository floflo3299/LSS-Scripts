// ==UserScript==
// @name         Settings ELW 1 SEG from start screen
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  change all ELW 1 SEG settings from the start screen
// @author       Silberfighter
// @include      *://www.leitstellenspiel.de/
// @include      /^https?:\/\/(?:w{3}\.)?(?:polizei\.)?leitstellenspiel\.de\/$/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @require      https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/HelperMethods.js
// @require      https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/UTF16Converter.js
// @grant        GM_addStyle
// ==/UserScript==

(async function() {

    createOrAssigneDropdownmenu("settingsELW1SEG", "change ELW 1 SEG Settings", showOwnCustomOverlay);


    let allVehicles;

    console.log(allVehicles);

    let baseID = "ELW1SEGSettings";

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
            width: 1000px;
            overflow-y: auto;
        }

        #ELWSEG-overlay-content-entry {
            position: relative;
            display: block;
            margin-top: 10px;
            margin-bottom: 10px;
        }


    `);


    // Function to show the overlay
    async function showOwnCustomOverlay() {
        document.getElementById(baseID + "-overlay-container").style.display = 'block';

        document.getElementById(baseID + "WaitMessage").className = "";

        if (!sessionStorage.c2Vehicles || JSON.parse(sessionStorage.c2Vehicles).lastUpdate < (new Date().getTime() - 5 * 1000 * 60) || JSON.parse(sessionStorage.c2Vehicles).userId != user_id) {
            await $.getJSON('/api/vehicles').done(data => sessionStorage.setItem('c2Vehicles', JSON.stringify({ lastUpdate: new Date().getTime(), value: LZString.compress(JSON.stringify(data)), userId: user_id })));
        }

        allVehicles = JSON.parse(LZString.decompress(JSON.parse(sessionStorage.c2Vehicles).value));

        document.getElementById(baseID + "WaitMessage").className = "hidden";
    }

    // Function to hide the overlay
    function hideOwnCustomOverlay() {
        document.getElementById(baseID + "-overlay-container").style.display = 'none';

        allVehicles = [];
    }


    // Add event listener to toggle the overlay on click
    overlayContainer.addEventListener('click', function(event) {
        if (event.target === overlayContainer) {
            overlayContainer.style.display = 'none';
            //event.stopPropagation(); // Prevent the click event from propagating to underlying elements
        }
    });


    overlayContent.innerHTML += `
        <div class="overlay-header" id="`+baseID+`OverlayHeader">
        <div>
            <h1 id="`+baseID+`WaitMessage" class="hidden" style="color:red;"><center>BITTE WARTEN, Daten laden</center></h1>
            <h3><center>ELW 1 SEG Settings ändern</center></h3>
            <h5><center>Warte 5 Minuten nach dem Kauf von ELW 1 SEG Fahrzeugen, bevor das Skript verwendet wird. Andernfalls kann es passieren, dass das Skript nicht alle Fahrzeuge berücksichtigt. Da es zur Zeit nicht anders möglich ist, durchläuft das Skript immer alle ELW 1 SEG Fahrzeuge, auch wenn das Fahrzeug bereits korrekt eingestellt ist.</center></h5>
        </div>
        </div>
        <div class="overlay-body" id="`+baseID+`OverlayBody">
        </div>
    `;

    document.getElementById(baseID + "OverlayBody").innerHTML += `
    <div><label class="ELWSEG-overlay-content-entry"><input id="elw1seg_hospital_automatic" type="checkbox" style="margin-right: 10px;" value="1">Rettungsdienst automatisch ein Krankenhaus zuweisen</label></div>
    <div><label class="ELWSEG-overlay-content-entry"><input id="elw1seg_hospital_own" type="checkbox" style="margin-right: 10px;" value="1">Nur eigene Krankenhäuser anfahren</label></div>
    <div><label class="ELWSEG-overlay-content-entry"><input id="elw1seg_hospital_right_building_extension" type="checkbox" style="margin-right: 10px;" value="1">Nur an Krankenhäuser mit passenden Ausbau einliefern</label></div>
    <div><label class="ELWSEG-overlay-content-entry"><input id="vehicle_hospital_automatic_return" type="checkbox" style="margin-right: 10px;" value="1">Rettungsdienst kehrt nach automatischem Transport zum Einsatz zurück</label></div>

    <div style="height: 45px;">
        <div class="col-sm-3"><label>Maximale Abgabe vom Creditsverdienst</label></div>
        <div class="col-sm-9"><select id="elw1seg_hospital_max_price" class="form-control">
            <option value="0">0 %</option>
            <option value="10">10 %</option>
            <option value="20">20 %</option>
            <option value="30">30 %</option>
            <option value="40">40 %</option>
            <option value="50" selected="selected">50 %</option></select></div></div>

    <div style="height: 45px;">
        <div class="col-sm-3"><label>Max. Entfernung zum Krankenhaus</label></div>
        <div class="col-sm-9"><select id="elw1seg_hospital_max_distance" class="form-control">
            <option value="1">1 km</option>
            <option value="5">5 km</option>
            <option value="20">20 km</option>
            <option value="50">50 km</option>
            <option value="100" selected="selected">100 km</option>
            <option value="200">200 km</option></select></div></div>

    <div style="height: 45px;">
        <div class="col-sm-3"><label>Anzahl der freizulassenden Plätze im Krankenhaus</label></div>
        <div class="col-sm-9"><select id="elw1seg_hospital_free_space" class="form-control">
            <option value="0" selected="selected">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option></select></div></div>

    <div style="margin-top: 20px;">
        <a id="apply-elw1seg-settings" class="btn btn-success" style="height: 34px;">Einstellungen auf allen Fahrzeugen übernehmen</a>
    </div>
    `

    let messageText;

    if(document.getElementById(baseID+"MessagetTxt")){
        messageText = document.getElementById(baseID+"MessagetTxt");
    }else{
        messageText = document.createElement("div");
        messageText.id = baseID+"MessagetTxt";
        messageText.style.fontSize = "x-large";
        messageText.style.fontWeight = "900";
        document.getElementById(baseID + "OverlayBody").appendChild(messageText);
    }


    document.getElementById("apply-elw1seg-settings").addEventListener('click', function() {
        applySettings();
    });

    async function applySettings(){
        let automatic = document.getElementById("elw1seg_hospital_automatic").checked;
        let ownHospital = document.getElementById("elw1seg_hospital_own").checked;
        let correctExtension = document.getElementById("elw1seg_hospital_right_building_extension").checked;
        let maxCredits = document.getElementById("elw1seg_hospital_max_price").value;
        let maxDistance = document.getElementById("elw1seg_hospital_max_distance").value;
        let freeSpace = document.getElementById("elw1seg_hospital_free_space").value;
        let automaticReturn = document.getElementById("vehicle_hospital_automatic_return").value;



        /*        console.log(automatic);
        console.log(ownHospital);
        console.log(correctExtension);
        console.log(maxCredits);
        console.log(maxDistance);
        console.log(freeSpace);
        console.log(automaticReturn);*/

        let relevantVehicles = allVehicles.filter(e => Number(e.vehicle_type) == 59);
        console.log(relevantVehicles);

        messageText.innerText = relevantVehicles.length+" Fahrzeuge verbleibend";

        for(let i = 0; i < relevantVehicles.length; i++){


            await $.post("/vehicles/" + relevantVehicles[i].id, { "_method": "put", "authenticity_token": $("meta[name=csrf-token]").attr("content"),
                                                                 "vehicle[hospital_automatic]" : automatic,
                                                                 "vehicle[hospital_own]" : ownHospital,
                                                                 "vehicle[hospital_right_building_extension]" : correctExtension,
                                                                 "vehicle[hospital_max_price]" : maxCredits,
                                                                 "vehicle[hospital_max_distance]" : maxDistance,
                                                                 "vehicle[hospital_free_space]" : freeSpace,
                                                                 "vehicle[hospital_automatic_return]" : automaticReturn,
                                                                });


            messageText.innerText = (relevantVehicles.length-i-1)+" Fahrzeuge verbleibend";

            await delay(50);
        }

        messageText.innerText = "Fertig";
    }

    // Function to convert an object to x-www-form-urlencoded format
    function encodeFormData(data) {
        return Object.keys(data)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
            .join('&');
    }

})();
