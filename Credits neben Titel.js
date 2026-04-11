// ==UserScript==
// @name         Credits neben Titel
// @version      1.1.0
// @description  zeigt die Credits-Menge für den Einsatz im Titel an
// @author       Silberfighter
// @include      *www.leitstellenspiel.de/missions/*
// @include      *www.leitstellenspiel.de
// @include      *www.leitstellenspiel.de/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// ==/UserScript==



// Farbe für die niedrige Credits-Kategorie
const farbe_low = "#f8d7da"; // red

// untere Greditsgrenze
const credits_grenze_low = 5000;

// Farbe für die mittlere Credits-Kategorie
const farbe_mid = "#fff3cd"; // yellow

// obere Greditsgrenze
const credits_grenze_mid = 10000;

// Farbe für die niedrige Credits-Kategorie
const farbe_high = "#d4edda"; // green





const STORAGE_KEY = "AllMissionsJSONForLeitstellenspiel"

this.$ = this.jQuery = jQuery.noConflict(true);

$(document).ready(async function(){

    if(window.location.href.includes("missions")){
        let missionID = getMissionID();

        let missionInfo = getMissionRequirements(missionID + "-0");

        if(missionInfo == null){
            missionInfo = getMissionRequirements(missionID);
        }

        if(missionInfo == null){
            await getAndSaveAllMissions();
            missionInfo = getMissionRequirements(missionID);
        }



        if("average_credits" in missionInfo){
            var title = $('#missionH1', document);

            var a = document.createElement("small");
            a.innerHTML = "; " + missionInfo.average_credits.toLocaleString('de-DE') + " Credits";
            title[0].parentNode.append(a);
        }
    }else{

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // element node

                            let textArray = node.getElementsByClassName("map_position_mover");

                            if(textArray.length > 0){
                                if(textArray[0].getElementsByClassName("CreditsLabel").length == 0){
                                    //textArray[0].innerHTML += '<small class="CreditsLabel">; ' + JSON.parse(node.getAttribute("data-sortable-by")).average_credits.toLocaleString('de-DE') + ' Credits</small>';

                                    const avgCredits = JSON.parse(node.getAttribute("data-sortable-by")).average_credits;

                                    let bgColor = "";

                                    if (avgCredits < credits_grenze_low) {
                                        bgColor = farbe_low;
                                    } else if (avgCredits < credits_grenze_mid) {
                                        bgColor = farbe_mid;
                                    } else {
                                        bgColor = farbe_high;
                                    }

                                    textArray[0].innerHTML += `
    <div style="background-color: ${bgColor}; padding: 4px 8px; border-radius: 4px; display: inline-block;">
        <small class="CreditsLabel">${avgCredits.toLocaleString('de-DE')} Credits</small>
    </div>
`;
                                }
                            }
                        }
                    }
                }
            }
        });


        const mission_list_ids = ["mission_list", "mission_list_krankentransporte", "mission_list_krankentransporte_alliance", "mission_list_sicherheitswache", "mission_list_sicherheitswache_alliance", "mission_list_alliance", "mission_list_alliance_event"];


        for (const mission_list_id_name of mission_list_ids) {
            observer.observe(document.getElementById(mission_list_id_name), {
                childList: true,
                subtree: false
            });
        }
    }
});





function getMissionID(){
    let missionNumber;

    if(document.getElementById("mission_help").href){
        missionNumber = document.getElementById("mission_help").href.replace("https://www.leitstellenspiel.de/einsaetze/","");

        missionNumber = missionNumber.replace("?additive_overlays=","/");

        // holt sich die Einsatzdetails
        if(missionNumber.indexOf('mission_id')>=0){
            return missionNumber.substring(0,missionNumber.indexOf('mission_id')-1);
        }
    }

    return "";;
}

function getMissionRequirements(missionID){
    let missions = localStorage.getItem(STORAGE_KEY);

    missions = JSON.parse(missions);

    return missions.find(m => m.id === String(missionID)) ?? null;
}

async function getAndSaveAllMissions(){

    let missions = await fetch("https://www.leitstellenspiel.de/einsaetze.json").then(r => r.json());


    const REMOVE_KEYS = [
        'place',
        'place_array',
        'generated_by',
        'icons',
        'prerequisites',
        'overlay_index',
        'base_mission_id',
        'additive_overlays',
        'mission_categories'
    ];

    missions = missions.map(obj =>Object.fromEntries( Object.entries(obj).filter(([key]) => !REMOVE_KEYS.includes(key))));


    const REMOVE_KEYS_ADDITIONAL = [
        'expansion_missions_ids',
        'filter_id',
        'allow_without_poi',
        'followup_missions_ids',
        'patient_specialization_captions',
        'patient_specialization_ids',
        'patient_specializations',
        'allow_without_poi',
        'allow_without_poi'
    ];

    missions = missions.map(m => ({
        ...m,
        additional: m.additional
        ? Object.fromEntries(
            Object.entries(m.additional)
            .filter(([k]) => !REMOVE_KEYS_ADDITIONAL.includes(k))
        )
        : m.additional
    }));


    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
}




