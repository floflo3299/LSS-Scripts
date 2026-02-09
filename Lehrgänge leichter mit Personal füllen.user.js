// ==UserScript==
// @name        Lehrgänge leichter mit Personal füllen
// @namespace    http://tampermonkey.net/
// @version      1.4.0
// @description  enables the filtering of buildings in the creation of courses and select people faster!
// @author      Silberfighter
// @include      https://www.leitstellenspiel.de/buildings/*
// @include      https://www.leitstellenspiel.de/schoolings/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @require      https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/UTF16Converter.js
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';


    //------- you can change this variables -------

    //true    mit der Taste Q können die Personen ausgewählt werden (Taste "Auswählen" wird gedrückt) und mit E der/die Lehrgänge gestartet werden (Taste "Ausbilden" wird gedrückt)
    //false   die Tastenbelegung geht nicht
    const enable_keys = false;

    //Mit dieser Variable können Standard-Filter-Werte für einzelne Lehrgänge festgelegt werden
    //Dabei muss man wie folgt vorgehen:

    //1. Suche den Namen des Lehrgang raus, für welchen Standard-Filter-Werte erstellt werden sollen. Füge diesen Namen in eckigen Klammern und Anführungszeichen ein.
    //Beispiel: ["GW-Gefahrgut Lehrgang"]

    //2. Falls standardmäßig nach einem Gebäude gefiltert werden soll, füge in Anführungszeichen die ID dem obigen Eintrag hinzu. Andernfalls füge leere Anfähungzeichen hinzu
    //Beispiel falls EIN Gebäude standardmäßig ausgewählt werden soll: ["GW-Gefahrgut Lehrgang","0"]
    //Beispiel falls KEIN Gebäude standardmäßig ausgewählt werden soll: ["GW-Gefahrgut Lehrgang",""]

    //3. Falls standardmäßig nach einer Erweiterung gefiltert werden soll, füge in Anführungszeichen den exakten Namen der Erweiterung dem obigen Eintrag hinzu. Andernfalls füge leere Anfähungzeichen hinzu
    //Beispiel falls EINE Erweiterung standardmäßig ausgewählt werden soll: ["GW-Gefahrgut Lehrgang","0","Großwache"]
    //Beispiel falls KEINE Erweiterung standardmäßig ausgewählt werden soll: ["GW-Gefahrgut Lehrgang","0",""]

    //4. Falls standardmäßig nur Gebäude angezeigt werden sollen, in welchen noch keine gewisse Anzahl an Ausbildungen vorhanden ist, füge in Anführungszeichen die Anzahl der Ausbildungen dem obigen Eintrag hinzu.
    //Andernfalls füge leere Anfähungzeichen hinzu
    //Beispiel falls nach vorhandenen Ausbildungen gefiltert werden soll: ["GW-Gefahrgut Lehrgang","0","Großwache","6"]
    //Beispiel falls nicht nach vorhandenen Ausbildungen gefiltert werden soll: ["GW-Gefahrgut Lehrgang","0","Großwache",""]

    //5. Falls standardmäßig nur Gebäude angezeigt werden sollen, in welchen eine gewisse Anzahl an Leuten vorhanden ist, füge in Anführungszeichen die Anzahl der Ausbildungen dem obigen Eintrag hinzu.
    //Andernfalls füge leere Anfähungzeichen hinzu
    //Beispiel falls nach Anzahl des Personal gefiltert werden soll: ["GW-Gefahrgut Lehrgang","0","Großwache","6","80"]
    //Beispiel falls nicht nach Anzahl des Personals gefiltert werden soll: ["GW-Gefahrgut Lehrgang","0","Großwache","6",""]

    //6. Füge zum Schluss ein Komma hinten hinzu
    //Beispiel: ["GW-Gefahrgut Lehrgang","0","Großwache","6","80"],

    //7. Diesen nun generierten Eintrag fügst du unten zwischen den beiden Kommentaren ein. Ob du alle Einträge in eine Zeile schreibst oder in eine Zeile nur einen Eintrag ist egal.

    var standardFilterWerte = [
        //***** unterhalb von hier einfügen *****

        
        ["SEK","11","SEK","42","53"],
        ["MEK","11","MEK","42","53"],


        //***** oberhalb von hier einfügen *****
    ];

    //------- after here change only stuff if you know what you are doing -------


    if(enable_keys){
        document.addEventListener("keydown", async (e) => {
            // e.key is the actual character (respects keyboard layout + shift)
            if (e.key.toLowerCase() === "q") {
                // optional: avoid repeated firing when key is held down
                if (e.repeat) return;

                // your action here
                autoSelectPeople();
            }
            if (e.key.toLowerCase() === "e") {
                // optional: avoid repeated firing when key is held down
                if (e.repeat) return;

                // your action here
                document.querySelector('input[name="commit"][type="submit"][value="Ausbilden"]').click();
            }
        });
    }


    var defaultValueSettings = [["","","","",""]]

    //Füge hier neue Gebäude hinzu, damit sie mit berücksichtigt werden
    var feuerwehrGebaeude = [["Feuerwache",0],["Feuerwache (Kleinwache)",18]];
    var thwGebaeude = [["THW Ortsverband",9]];
    var polizeiGebaeude = [["Polizeiwache",6],["Polizeiwache (Kleinwache)",19],["Bereitschaftspolizei",11],["Polizeihubschrauber-Station",13],["Polizei-Sondereinheit",17],["Reiterstaffel",24]];
    var rettungsDienstGebaeude = [["Rettungswache",2],["Rettungswache (Kleinwache)",20],["Rettungshubschrauber-Station",5],["Rettungshundestaffel",21],["SEG",12],["Wasserrettungswache",15],["Bergrettung",25]];
    var seenotGebaude = [["Seenotrettungswache",26],["Hubschrauberstation (Seenotrettung)",28]];


    var buildings;

    if($('#accordion').length == 0){
        //if no buildings are listed (inside elem accordion), then do nothing => verbands school
        return;
    }


    if (!sessionStorage.getItem('c2Buildings') || JSON.parse(sessionStorage.c2Buildings).lastUpdate < (new Date().getTime() - 5 * 1000 * 60) || JSON.parse(sessionStorage.c2Buildings).userId != user_id) {
        //console.log("load")
        await $.getJSON('/api/buildings').done(data => sessionStorage.setItem('c2Buildings', JSON.stringify({ lastUpdate: new Date().getTime(), value: LZString.compress(JSON.stringify(data)), userId: user_id })));
    }

    buildings = JSON.parse(LZString.decompress(JSON.parse(sessionStorage.getItem('c2Buildings')).value));


    var buildingType = 0;
    if(window.location.href.includes("leitstellenspiel.de/buildings/")){
        buildingType = document.getElementsByTagName("h1")[0].getAttribute("building_type");
    } else if(window.location.href.includes("leitstellenspiel.de/schoolings/")){

        var shownBuildings = Array.prototype.slice.call($('#accordion')[0].getElementsByTagName("div"));
        shownBuildings = shownBuildings.filter(b => b.hasAttribute("building_id"));
        shownBuildings = shownBuildings.map(b => parseInt(b.getAttribute("building_id")));
        shownBuildings = shownBuildings.map(b => {
            var filteredB = buildings.filter(b2 => b2.id == b);
            if(filteredB.length > 0){
                return filteredB[0].building_type;
            } else {
                return -1;
            }
        });

        if (shownBuildings.filter(b => parseInt(b) == 0).length > 0){
            buildingType = 1;
        }
        if (shownBuildings.filter(b => parseInt(b) == 2).length > 0){
            buildingType = 3;
        }
        if (shownBuildings.filter(b => parseInt(b) == 6).length > 0){
            buildingType = 8;
        }
        if (shownBuildings.filter(b => parseInt(b) == 9).length > 0){
            buildingType = 10;
        }

    }
    var allBuil = [];
    var lehrgangsBezeichnung_SessionStorage = NaN;

    if (buildingType == 1 || buildingType == 3 || buildingType == 8 || buildingType == 10 || buildingType == 27){

        var dropDownSelectionGebaeude = [];

        if (buildingType == 1){
            dropDownSelectionGebaeude = feuerwehrGebaeude;
        }
        if (buildingType == 3){
            dropDownSelectionGebaeude = rettungsDienstGebaeude;
        }
        if (buildingType == 8){
            dropDownSelectionGebaeude = polizeiGebaeude;
        }
        if (buildingType == 10){
            dropDownSelectionGebaeude = thwGebaeude;
        }
        if (buildingType == 27){
            dropDownSelectionGebaeude = seenotGebaude;
        }

        //console.log(buildings.length)
        var dropDownSelectionAusbau = getAvailablExtensions(dropDownSelectionGebaeude, buildings)

        //var building = cBuildings.filter(b => b.id == buildingID)[0];

        var newWindow = document.createElement("div");

        var text = `
            <p style="display: inline-block"><b>Achtung! Achtung! Achtung! Bei der Verwendung von Skripten, welche die Oberfläche verändern (z.B. LSS-Manager oder das Lehrgangsskript vom Waldgott) kann es passieren, dass die Lehrgangs-Skripte nicht mehr funktioniert! In diesem Fall das oberflächenverändernde Skript ausschalten und nach der Lehrgangszuweisung wieder einschalten.</b></p>`;
        newWindow.innerHTML = text;

        $('#accordion').before(newWindow);


        newWindow = document.createElement("div");

        text = `
            <p style="display: inline-block"><b>TIP: öffne die Gebäude von unten nach oben, dann musst du nicht scrollen!</b></p>`;
        newWindow.innerHTML = text;

        $('#accordion').before(newWindow);


        newWindow = document.createElement("div");

        text = `
            <p style="display: inline-block"><b>Wenn unten in der Liste am rechten Rand "Lade..." erscheint und nicht mehr verschwindet, einmal minimal scrollen!</b></p>`;
        newWindow.innerHTML = text;

        $('#accordion').before(newWindow);



        //Verbands-Gebäude haben derzeit keine Gebäudefilter-Knöpfe, deswegen die Unterscheidung
        if(document.getElementsByClassName('btn building_selection').length == 0){
            newWindow = document.createElement("div");

            text = `
          Nach Gebäuden filtern
          <select id="gebaeudeArt" name="gebaeudeFiltern" style="display:inline-block; color: #000;">
                <option value="">nicht filtern</option>`;
            for(var i = 0; i < dropDownSelectionGebaeude.length; i++){
                text += `<option value="` + dropDownSelectionGebaeude[i][1] +`">`+ dropDownSelectionGebaeude[i][0] +`</option>`;
            }
            text += `</select>`;
            newWindow.innerHTML = text;

            $('#accordion').before(newWindow);
        }


        newWindow = document.createElement("div");

        text = `
          Nach Ausbauten filtern
          <select id="ausbau" name="ausbauFiltern" style="display:inline-block; color: #000;">
                <option value="">nicht filtern</option>`;
        for(let i = 0; i < dropDownSelectionAusbau.length; i++){
            text += `<option value="` + dropDownSelectionAusbau[i] +`">`+ dropDownSelectionAusbau[i] +`</option>`;
        }
        text += `</select>`;
        newWindow.innerHTML = text;

        $('#accordion').before(newWindow);


        newWindow = document.createElement("div");

        text = `
          Lager vorhanden:
          <input type="checkbox" id="lager" name="lagerFiltern" style="display:inline-block; color: #000;">`;
        newWindow.innerHTML = text;

        $('#accordion').before(newWindow);


        newWindow = document.createElement("div");

        text = `
            <p style="display: inline-block">zeige nur Wachen mit weniger Ausbildungen als ausgewählter Anzahl an:</p>
            <input style="display:inline-block; color: #000; width:50px;" type="number" id="maxAusbildungen" min="1" value=""></input>`;
        newWindow.innerHTML = text;

        $('#accordion').before(newWindow);


        newWindow = document.createElement("div");

        text = `
            <p style="display: inline-block">zeige nur Wachen an, die mindestens die ausgewählte Personenanzahl haben:</p>
            <input style="display:inline-block; color: #000; width:50px;" type="number" id="minPerson" min="1" value=""></input>`;
        newWindow.innerHTML = text;

        $('#accordion').before(newWindow);


        let div = document.createElement("div");
        div.className = "navbar-text navbar-right"
        div.innerHTML = `
                <p style="display: inline-block">füllt die Anzahl der Ausbildungen pro Wache bis zur gewählten Zahl auf  </p>
                <input style="display:inline-block; color: #000; width:50px;" type="number" id="maxPerBuilding" min="1" value="1"></input>
                <a id="btnAutoSelect" class="btn btn-success">Auswählen</a>
                <input id="noEduc" name="noEduc" type="checkbox" checked="true">
                <label class="" for="noEduc">nur Personal ohne Ausbildung</label>
                <input id="noAss" name="noAss" type="checkbox" checked="true">
                <label class="" for="noAss">nur ungebundenes Personal</label>
        `;


        let insertBeforeElement = $('#schooling_free')[0].parentElement
        insertBeforeElement.parentElement.insertBefore(div, insertBeforeElement);

        $('#btnAutoSelect').on('click', function() { autoSelectPeople(); });

        //document.getElementById('ausbau').addEventListener ('change', filterBuildings);
        //document.getElementById('maxAusbildungen').addEventListener ('change', filterBuildings);

        allBuil = Array.prototype.slice.call($('#accordion')[0].getElementsByClassName('panel panel-default'));


        var setting = [];

        var sel_dropdown = document.querySelector('#education_select');

        if(sel_dropdown != null){
            //own school
            sel_dropdown.addEventListener('change', (e) => {
                var lehrgangsBezeichnung = e.target.selectedOptions[0]?.textContent.trim() || '';
                lehrgangsBezeichnung = lehrgangsBezeichnung.replace(/\s*\(\d+\s*Tag(?:e)?\)\s*$/, '');

                setting = standardFilterWerte.filter((e) => e[0] === lehrgangsBezeichnung);

                lehrgangsBezeichnung_SessionStorage = "LSS_TrainingsPerBuidlding_" + lehrgangsBezeichnung;

                if(e.target.value == ""){
                    lehrgangsBezeichnung_SessionStorage = NaN;
                }


                checkNumberTrainedPersonal();


                if(setting.length == 0){
                    setting = defaultValueSettings;
                }


                filterBuilding(setting[0][1]);
                $("#ausbau")[0].value = setting[0][2];
                $("#maxAusbildungen")[0].value = setting[0][3];
                $("#minPerson")[0].value = setting[0][4];
                $("#maxPerBuilding")[0].value = setting[0][3];
                if(setting[0][3] == ""){
                    $("#maxPerBuilding")[0].value = 1;
                }
            });
        }else{
            //verbands school
            if(document.getElementsByTagName("h2").length > 0 && (document.getElementsByTagName("h2")[0] == null || document.getElementsByTagName("h2")[0].parentNode.className != "alert alert-info")){
                setting = standardFilterWerte.filter((e) => e[0] === document.getElementsByTagName("h2")[0].innerText);

                lehrgangsBezeichnung_SessionStorage = "LSS_TrainingsPerBuidlding_" + document.getElementsByTagName("h2")[0].innerText;


                checkNumberTrainedPersonal();

                filterBuilding(setting[0][1]);
                $("#ausbau")[0].value = setting[0][2];
                $("#maxAusbildungen")[0].value = setting[0][3];
                $("#minPerson")[0].value = setting[0][4];
                $("#maxPerBuilding")[0].value = setting[0][3];
                if(setting[0][3] == ""){
                    $("#maxPerBuilding")[0].value = 1;
                }
            }
        }

    }

    function checkNumberTrainedPersonal(){
        //resets storage every hour, to compensate personal changes
        if (!localStorage.getItem(lehrgangsBezeichnung_SessionStorage) || JSON.parse(localStorage.getItem(lehrgangsBezeichnung_SessionStorage)).lastUpdate < (new Date().getTime() - 60 * 1000 * 60)) {
            saveNumberTrainedPersonal({});
        }
    }

    function saveNumberTrainedPersonal(objectToSave){
        localStorage.setItem(lehrgangsBezeichnung_SessionStorage, JSON.stringify({ lastUpdate: new Date().getTime(), value: LZString.compress(JSON.stringify(objectToSave))}));
    }

    function loadNumberTrainedPersonal(){
        //console.log("LOAD");
        if (lehrgangsBezeichnung_SessionStorage && localStorage.getItem(lehrgangsBezeichnung_SessionStorage)){
            return JSON.parse(LZString.decompress(JSON.parse(localStorage.getItem(lehrgangsBezeichnung_SessionStorage)).value));
        }
        return {};
    }


    function filterBuilding(buildingID){
        buildingID = parseInt(buildingID);

        let allBuildingsBtn = document.getElementsByClassName('btn building_selection');
        let allBuildingsIDs = [];

        for(let i = 0; i < allBuildingsBtn.length; i++){
            let buildingIDsOfBtn = JSON.parse(allBuildingsBtn[i].getAttribute("building_type_ids")).map(Number);

            if(allBuildingsBtn[i].classList.contains('btn-danger') && isNaN(buildingID)){
                allBuildingsBtn[i].click();
                continue;
            }

            if(isNaN(buildingID)){
                continue;
            }
            else if(allBuildingsBtn[i].classList.contains('btn-success') && !buildingIDsOfBtn.includes(buildingID)){
                allBuildingsBtn[i].click();
            }
            else if(allBuildingsBtn[i].classList.contains('btn-danger') && buildingIDsOfBtn.includes(buildingID)){
                allBuildingsBtn[i].click();
            }
        }

        //Verbands-Gebäude haben derzeit keine Gebäudefilter-Knöpfe, deswegen die Unterscheidung
        if(allBuildingsBtn.length > 0){
            return [...new Set(allBuildingsIDs)];
        }
        else{
            if(isNaN(buildingID)){
                document.getElementById("gebaeudeArt").value = "";
            }else{
                document.getElementById("gebaeudeArt").value = buildingID;
            }

            return [buildingID];
        }
    }

    function getToFilterBuildingIDs(){
        let allBuildingsBtn = document.getElementsByClassName('btn building_selection');
        let allBuildingsIDs = [];

        for(let i = 0; i < allBuildingsBtn.length; i++){
            if(allBuildingsBtn[i].classList.contains('btn-success')){
                let buildingIDs = JSON.parse(allBuildingsBtn[i].getAttribute("building_type_ids")).map(Number);
                allBuildingsIDs = allBuildingsIDs.concat(buildingIDs);
            }
        }

        //Verbands-Gebäude haben derzeit keine Gebäudefilter-Knöpfe, deswegen die Unterscheidung
        if(allBuildingsBtn.length > 0){
            return [...new Set(allBuildingsIDs)];
        }
        else{
            return [parseInt(document.getElementById('gebaeudeArt').value)];
        }
    }


    var relevantBuildingIDs = [];
    var oldAusbauSelection = NaN;
    var oldGebäudeSelection = NaN;
    var oldNumPeopleSelection = NaN;
    var oldLagerSelection = NaN;
    var oldMaxAusbildungen = NaN;

    var alreadyTrainedPersonalPerBuilding = {};

    function updateRelevantBuildings(){
        oldAusbauSelection = document.getElementById('ausbau').value;
        oldGebäudeSelection = getToFilterBuildingIDs();
        oldNumPeopleSelection = document.getElementById('minPerson').value;
        oldLagerSelection = document.getElementById('lager').checked;
        oldMaxAusbildungen = document.getElementById('maxAusbildungen').value;

        let maxAusbildung = parseInt(oldMaxAusbildungen);


        alreadyTrainedPersonalPerBuilding = loadNumberTrainedPersonal();

        relevantBuildingIDs = [];

        var filtered;

        filtered = buildings.filter((e) => {
            if(e.extensions){
                return (oldGebäudeSelection.includes(NaN) || oldGebäudeSelection.includes(e.building_type)) && (document.getElementById('minPerson').value == "" || parseInt(document.getElementById('minPerson').value) <= e.personal_count) &&
                    (document.getElementById('ausbau').value == "" || e.extensions.filter((e1) => e1.caption.indexOf(document.getElementById('ausbau').value) >= 0).length > 0) &&
                    (oldLagerSelection == false || e.storage_upgrades.length > 0) &&
                    (!Object.hasOwn(alreadyTrainedPersonalPerBuilding, e.id) || !Number.isInteger(maxAusbildung) || Number.isInteger(maxAusbildung) && alreadyTrainedPersonalPerBuilding[e.id.toString()] < maxAusbildung);
            } else {
                return false;
            }
        });

        for(var n=0; n < filtered.length; n++){
            relevantBuildingIDs.push(parseInt(filtered[n].id));
        }
    }

    filterBuildings();

    async function filterBuildings(){
        if(buildings){
            //check for changes-settings
            if(oldAusbauSelection != document.getElementById('ausbau').value || oldGebäudeSelection.toString() != getToFilterBuildingIDs().toString() || oldNumPeopleSelection != document.getElementById('minPerson').value ||
               oldLagerSelection != document.getElementById('lager').checked || oldMaxAusbildungen != document.getElementById('maxAusbildungen').value){
                updateRelevantBuildings();

                //hide all buildings which are irrelevant
                for(var n1 = 0; n1 < allBuil.length;n1++){
                    if(relevantBuildingIDs.includes(parseInt(allBuil[n1].getElementsByClassName('panel-heading personal-select-heading')[0].getAttribute("building_id")))){
                        allBuil[n1].classList.replace("hidden", "panel-default");
                    } else {
                        allBuil[n1].classList.replace("panel-default", "hidden");

                        //unselecting of people when building is filtered out. DEACTIVATED, bevause the default building-filter of leitstellenspiel is also not unselection selected people
                        /*if(allBuil[n].getElementsByClassName('panel-body').length > 0 && allBuil[n].getElementsByClassName('panel-body hidden').length == 0){
                        allBuil[n].getElementsByClassName('panel-heading personal-select-heading')[0].click();

                        var allPeople = Array.prototype.slice.call(allBuil[n].getElementsByTagName("tr"));
                        //remove first entry, it's the header
                        allPeople.shift();

                        for (let i = 0; i < allPeople.length; i++) {
                            UnselectPeople(allPeople[i]);
                        }
                    }*/
                    }
                }
            }


            //check all displayed (not hidden) buildings
            let updateSessionStorage = false;

            for(var n2 = 0; n2 < allBuil.length;n2++){
                if (allBuil[n2].classList.contains('building-filtered-by-type') || allBuil[n2].classList.contains('hidden')) {
                    continue;
                }


                if((document.getElementById('maxAusbildungen').value != "" && parseInt(document.getElementById('maxAusbildungen').value) <= getNumAusbildungen(allBuil[n2]))){
                    allBuil[n2].classList.replace("panel-default", "hidden");

                    let buildingIDStr = allBuil[n2].getElementsByClassName('panel-heading personal-select-heading')[0].getAttribute("building_id");
                    if(!Object.hasOwn(alreadyTrainedPersonalPerBuilding, buildingIDStr)){
                        alreadyTrainedPersonalPerBuilding[buildingIDStr] = getNumAusbildungen(allBuil[n2]);
                        updateSessionStorage = true;
                    }

                    //unselecting of people when building is filtered out. DEACTIVATED, bevause the default building-filter of leitstellenspiel is also not unselection selected people
                    /*if(allBuil[n].getElementsByClassName('panel-body').length > 0 && allBuil[n].getElementsByClassName('panel-body hidden').length == 0){
                        allBuil[n].getElementsByClassName('panel-heading personal-select-heading')[0].click();

                        var allPeople = Array.prototype.slice.call(allBuil[n].getElementsByTagName("tr"));
                        //remove first entry, it's the header
                        allPeople.shift();

                        for (let i = 0; i < allPeople.length; i++) {
                            UnselectPeople(allPeople[i]);
                        }
                    }*/
                }
            }

            if(updateSessionStorage){
                updateSessionStorage = false;
                saveNumberTrainedPersonal(alreadyTrainedPersonalPerBuilding);
            }
        }

        await delay(500);
        filterBuildings();
    }

    function getAvailablExtensions(relevantBuildings, allBuildings){
        const ids = relevantBuildings.map(([, value]) => value);

        let temp = allBuildings.filter(b => ids.includes(b.building_type));

        temp = temp.map(entry => entry.extensions);
        temp = temp.flat();
        temp = temp.map(entry => entry.caption);

        temp = [...new Set(temp)];

        //console.log(temp);

        return temp;
    }

    function delay(milliseconds){
        return new Promise(resolve => {
            setTimeout(resolve, milliseconds);
        });
    }

    function autoSelectPeople() {
        var allBuildings = Array.prototype.slice.call(document.getElementsByClassName("table table-striped tablesorter tablesorter-default"));


        //filter Gebäude raus, welche geöffnet und danach wieder geschlossen wurden und Gebäude welche durch Filter rausgefiltert wurden
        allBuildings = allBuildings.filter(item => !(item.parentElement.classList.contains('hidden') || item.parentElement.parentElement.classList.contains('hidden') || item.parentElement.parentElement.classList.contains('building-filtered-by-type')));


        allBuildings.forEach(item => {
            var allPeople = Array.prototype.slice.call(item.getElementsByTagName("tr"));
            allPeople.shift();

            var curSelected = getNumAusbildungen2(item);
            for (let i = 0; i < allPeople.length; i++) {
                if(IsPeopleAvailable(allPeople[i]) && IsPeopleSelected(allPeople[i])){
                    curSelected += 1;
                }

                if(IsPeopleAvailable(allPeople[i]) && IsPeopleSelected(allPeople[i]) && ((document.getElementById("noEduc").checked && HasPeopleASTraining(allPeople[i])) || (document.getElementById("noAss").checked && IsPeopleGebunden(allPeople[i])))){
                    UnselectPeople2(allPeople[i]);
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
                    UnselectPeople2(allPeople[i]);
                    curSelected -= 1;
                }
            }
        });
    }

    function getNumAusbildungen(building){
        var returnValue = 0;
        if(building.getElementsByClassName("label label-success").length > 0){
            returnValue += parseInt(building.getElementsByClassName("label label-success")[0].innerHTML) || 0;
        }
        if(building.getElementsByClassName("label label-info").length > 0){
            returnValue += parseInt(building.getElementsByClassName("label label-info")[0].innerHTML) || 0;
        }
        return returnValue;
    }

    function getNumPeople(building){
        return parseInt(building.getElementsByClassName("label label-default ")[0].innerHTML) || 0;
    }

    function UnselectPeople(entry){
        if(entry.getElementsByTagName("td")[0].getElementsByTagName("input").length > 0 && entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked){
            entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].click();
        }
    }

    function getNumAusbildungen2(building){
        building = building.parentNode.parentNode;
        var returnValue = 0;
        if(building.getElementsByClassName("label label-success").length > 0){
            returnValue += parseInt(building.getElementsByClassName("label label-success")[0].innerHTML) || 0;
        }
        //console.log(returnValue);
        if(building.getElementsByClassName("label label-info").length > 0){
            returnValue += parseInt(building.getElementsByClassName("label label-info")[0].innerHTML) || 0;
        }
        //console.log(returnValue);
        return returnValue;
    }

    function IsPeopleSelected(entry){
        return entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked;
    }

    function SelectPeople(entry){
        if(!entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked && parseInt($('#schooling_free')[0].innerHTML) > 0){
            entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].click();
        }
    }

    function UnselectPeople2(entry){
        if(entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].checked){
            entry.getElementsByTagName("td")[0].getElementsByTagName("input")[0].click();
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
