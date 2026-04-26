// ==UserScript==
// @name         PerformActionOnMultipleBuildingsInSchool
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  führt das "Verfügbare auswählen" in den Schulungen auf alle ausgeklappten Gebäude aus
// @author       Silberfighter
// @match        https://www.leitstellenspiel.de/buildings/*
// @match        https://www.leitstellenspiel.de/schoolings/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var forwardClick = true

    var alleWachen = document.getElementsByClassName("panel-heading personal-select-heading")

    //console.log(alleWachen)

    for (let ele of alleWachen){
        ele.addEventListener('click', function(event){
            var targetElement = event.target || event.srcElement;
            addListenerToDropDown(targetElement);
        }, false);
    }

    function addListenerToDropDown(ElementClickedOn){

        waitUntilLoaded(ElementClickedOn.nextElementSibling)

    }

    function waitUntilLoaded(elemToCheck){
        if(elemToCheck.childElementCount == 1){
            //console.log("relaoded")
            setTimeout(function(){
                waitUntilLoaded(elemToCheck);
            }, 100);
        }else{
            //console.log("laoded")

            let allDropDownElements = elemToCheck.getElementsByTagName("li")
            console.log(allDropDownElements)


            for (let ele of allDropDownElements){
                ele.addEventListener('click', function(event){
                    if(forwardClick){
                        var targetElement = event.target || event.srcElement;
                        listElementClicked(targetElement);
                    }
                }, false);
            }
        }
    }


    function listElementClicked(ElementClickedOn){
        forwardClick = false

        //console.log(ElementClickedOn)
        //console.log(ElementClickedOn.onclick.toString())

        let withOutSkill = ElementClickedOn.className == "schooling_select_available_without_education"
        let courseName = '"ohneAusbildung"'

        if (!withOutSkill){
            courseName = '"' + ElementClickedOn.onclick.toString().split('"')[1] + '"'
        }

        console.log(withOutSkill)
        console.log(courseName)


        let allLIClasses = document.getElementsByTagName("li")

        for (let ele of allLIClasses){
            let relevantChoild = ele.firstElementChild
            if (relevantChoild != null && (!withOutSkill && relevantChoild.className == "schooling_select_available_with_education" || withOutSkill && relevantChoild.className == "schooling_select_available_without_education")){
                //console.log(relevantChoild.onclick.toString().indexOf(courseName))

                if(relevantChoild.parentElement.parentElement.parentElement.parentElement.className == "panel-body"){
                    if(!withOutSkill && relevantChoild.onclick.toString().indexOf(courseName) >= 0 || withOutSkill && relevantChoild.className == "schooling_select_available_without_education"){
                        relevantChoild.click()
                    }
                }
            }
        }

        forwardClick = true
    }
})();
