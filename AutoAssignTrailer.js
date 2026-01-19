// ==UserScript==
// @name         Auto-Assign Trailes to Vehicles
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  weist automatisch Anhänger entsprechenden Zugfahrzeugen zu.
// @author       Silberfighter
// @match        https://www.leitstellenspiel.de/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @require      https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/HelperMethods.js
// @require      https://raw.githubusercontent.com/floflo3299/LSS-Scripts/main/HelperScripts/UTF16Converter.js
// @grant        GM_addStyle
// ==/UserScript==

(async function() {

    //    createOrAssigneDropdownmenu("autoAssignTrailer", "auto Assign Trailer", autoBuyVehiclesFromStartScreen);
    createOrAssigneDropdownmenu("autoAssignTrailer", "auto Assign Trailer", showOwnCustomOverlay);

    var links = [

        //------------ab hier bearbeiten

        // Was das Skript macht: Es weißt einem aktuell noch nicht zugewiesenem Anhänger ein entsprechendes Fahrzeug eines festgelgenten Fahrzeug-Typens zu

        // - es ignoriert Anhänger, welche bereits einem Zugfahrzeug zugewiesen ist
        // - es weist einem Fahrzeug maximal ein Anhänger zu. Fahrzeuge, die bereits als Zugfahrzeug eingesetzt werden, werden nicht nochmal zugewiesen
        // - es kontrolliert nicht, ob das Fahrzeug ein valides Zugfahrzeug vom entsprechenden Anhänger ist. Dies muss der Spieler sicherstellen
        // - das Zugfahrzeug wird zufällig ausgewählt. Entsprechende Namensgebungen (z.B. Fahrzeug/Anhänger eine speziellen Gruppe) werden nicht berücksichtigt
        // - wenn kein passendes Zugfahrzeug vorhanden ist (weil alle bereits als Zugfahrzeug hinterlegt sind oder gar keins vorhanden ist), wird dem Anhänger kein Zugfahrzeug zugewiesen


        // Wie das Skript richtig eingestellt wird:

        // erstelle einen Eintrag wie folgt und füge ihn unterhalb der markierten Zeile ein
        // [Fahrzeug-ID des Anhängers, Fahrzeug-ID des Zugfahrzeug],

        // dies sieht dann z.B. wie folgt aus:
        //[102,123],

        // 102 ist die ID des "Anh 7" vom THW, 123 die ID vom Fahrzeug-Typ "LKW 7 Lbw (WP)"
        // diese Zeile sorgt also dafür, dass dem    Anh 7   LKW 7 Lbw (WP)   als Zugfahrzeug zugewiesen wird. Stelle sicher, dass hinter der eckigen Klammer ein Komma eingefügt wird

        // Unterhalb befindet sich meine aktuelle Einstellung. Diese dient als Beispiel wie die Einträge schlussendlich aussehen sollen. Lösche oder passe die Einträge entsprechend deinen Vorlieben an bevor du das Skript ein erstes Mal ausführst.
        // Der Text nach den beiden   //   dient lediglich als Hinweis, wofür die IDs stehen und hat keine Auswirkung

        // WICHTIG: nachdem die Einträge entsprechend den eigenen Vorlieben abgeänder wurden und gespeichert wurde, lade Leitstellenspiel neu, damit die Änderungen übernommen werden

        // Zum Aktivieren des automatischen Zuweisens öffnet das Menü "Skripte", welches sich auf der Hauptseite oben in der Reihe (wo auch eure Credits angezeigt werden) ganz links befindet.
        // Wählt dort "auto Assign Trailer" oder in deutsch "automatisches Anhänger-Zuweisen" aus.

        //---- AB HIER EINTRÄGE EINFÜGEN


        [102,123], //Anh 7      LKW 7 Lbw (WP)
        [101,100], //Anh SwPu   MLW 4
        [43,42],   //BRmG R     LKW K 9
        [44,45],   //Anh DLE    MLW 5
        [110,41],  //NEA50      MzGW (FGr N)
        [112,122], //NEA200     LKW 7 Lbw (E)
        [70,64],   //MZB        GW-Wasserrettung
        [146,145], //Anh FüLa   FüKomKw
        [132,133], //Anh FKH    Bt LKW




    ];



    // setzte es auf    true     => wenn eine aktuelle Anhänger-Zugfahrzeug-Zuweisung nicht den obigen Einstellungen entspricht, wird es korrigiert.
    //                              z.B. aktuell gibt es einen Anh DLE, welcher von einem GKW gezogen wird, die Einstellungen legen aber einen MLW 5 fest, wird dieser "Fehler" behoben und der MLW 5 wird zugewiesen
    // setzte es auf    false     => "falsche" Zuweisungen werden nicht behoben
    const fix_wrong_assignments = false




    
    //------------ab hier nur bearbeiten, wenn ihr wisst was ihr macht

    var currentlyRunning = false

    async function autoBuyVehiclesFromStartScreen(){
        if (currentlyRunning){
            return
        }

        currentlyRunning = true


        /*if (!sessionStorage.c2Vehicles || JSON.parse(sessionStorage.c2Vehicles).lastUpdate < (new Date().getTime() - 5 * 1000 * 60) || JSON.parse(sessionStorage.c2Vehicles).userId != user_id) {
            await fetchAllVehiclesV2().then(data => sessionStorage.setItem('c2Vehicles', JSON.stringify({ lastUpdate: new Date().getTime(), value: LZString.compressToUTF16(JSON.stringify(data)), userId: user_id })));
        }

        var allVehicles = JSON.parse(LZString.decompressFromUTF16(JSON.parse(sessionStorage.c2Vehicles).value));*/
        var allVehicles = await fetchAllVehiclesV2();


        //console.log(allVehicles.length)

        document.getElementById(baseID + "WaitMessage").className = "hidden";


        for(var i = 0; i < links.length; i++){
            let foundTrailers = allVehicles.filter(e => e.vehicle_type == links[i][0]);
            //console.log(foundTrailers.length);
            //console.log(links[i]);

            let foundTowingVehicle = allVehicles.filter(e => e.vehicle_type == links[i][1]);

            for(var n = 0; n < foundTrailers.length; n++){

                messageText.innerText = (links.length-i)+" Fahrzeugtypen verbleibend\n"+(foundTrailers.length-n-1)+" Fahrzeuge vom aktuellen Typ verbleibend\nFENSTER NICHT SCHLIEßEN";

                //if(foundTrailers[n].tractive_vehicle_id == null || vehicleAssignedMultipleTimes(allVehicles, foundTrailers[n].tractive_vehicle_id)){
                if(foundTrailers[n].tractive_vehicle_id == null || foundTrailers[n].tractive_random == true ||
                   fix_wrong_assignments && foundTrailers[n].tractive_vehicle_id != null && foundTrailers[n].tractive_random == false && foundTowingVehicle.findIndex(obj => obj.id == foundTrailers[n].tractive_vehicle_id) == -1){ // wenn Zugfahrzeug existiert, aber kein zulässiges ist, weise es neu zu

                    if(foundTrailers[n].tractive_vehicle_id != null){
                        let index = allVehicles.findIndex((obj => obj.id == foundTrailers[n].id));
                        allVehicles[index].tractive_vehicle_id = null

                        foundTrailers[n].tractive_vehicle_id = null
                    }

                    //console.log("assigne trailer" + foundTrailers[n].id);
                    let foundVehicles = foundTowingVehicle.filter(e => e.building_id == foundTrailers[n].building_id);

                    for(var j = 0; j < foundVehicles.length; j++){
                        if(vehicleAlreadyAssigned(allVehicles, foundVehicles[j].id) == 0){
                            //console.log(foundTrailers[n].id);
                            //console.log(foundVehicles[j].id);
                            //console.log("");
                            await $.post("https://www.leitstellenspiel.de/vehicles/"+ foundTrailers[n].id, {"_method": "put", "authenticity_token": $("meta[name=csrf-token]").attr("content"), "vehicle[tractive_random]": 0, "vehicle[tractive_vehicle_id]": foundVehicles[j].id});
                            await delay(500);
                            let index = allVehicles.findIndex((obj => obj.id == foundTrailers[n].id));
                            //console.log(allVehicles[index])
                            allVehicles[index].tractive_vehicle_id = foundVehicles[j].id
                            //console.log(allVehicles[index])
                            break;
                        }
                    }
                }//else{
                //    await $.post("https://www.leitstellenspiel.de/vehicles/"+ foundTrailers[n].id, {"_method": "put", "authenticity_token": $("meta[name=csrf-token]").attr("content"), "vehicle[tractive_random]": 0, "vehicle[tractive_vehicle_id]": foundTrailers[n].tractive_vehicle_id});
                //    await delay(500);
                //}
                //await $.post("https://www.leitstellenspiel.de/vehicles/"+ foundTrailers[n].id, {"_method": "put", "authenticity_token": $("meta[name=csrf-token]").attr("content"), "vehicle[tractive_random]": 1, "vehicle[tractive_vehicle_id]": null});
                //await delay(500);
                //}
                //console.log("remaining Vehicle Types " + (links.length - i));
            }
        }


        messageText.innerText = "Zuweisung abgeschlossen";

        currentlyRunning = false
    }

    function vehicleAlreadyAssigned(allVehicles, vehicleId){
        let assignedVehicles = allVehicles.filter(e => e.tractive_vehicle_id == Number(vehicleId));
        //console.log(assignedVehicles.length)
        //console.log("pot vehicle" + vehicleId)
        return assignedVehicles.length > 0;
    }

    function vehicleAssignedMultipleTimes(allVehicles, vehicleId){
        let assignedVehicles = allVehicles.filter(e => e.tractive_vehicle_id == Number(vehicleId));
        return assignedVehicles.length > 1;
    }

    function delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }


    let baseID = "TrailerAssignment";

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


    `);


    // Function to show the overlay
    async function showOwnCustomOverlay() {
        document.getElementById(baseID + "-overlay-container").style.display = 'block';

        document.getElementById(baseID + "WaitMessage").className = "";

        autoBuyVehiclesFromStartScreen()
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


    overlayContent.innerHTML += `
        <div class="overlay-header" id="`+baseID+`OverlayHeader">
        <div>
            <h1 id="`+baseID+`WaitMessage" class="hidden" style="color:red;"><center>BITTE WARTEN, Daten laden</center></h1>
        </div>
        </div>
        <div class="overlay-body" id="`+baseID+`OverlayBody">
        </div>
    `;

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

})();
