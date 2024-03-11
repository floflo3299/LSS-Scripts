    function createOrAssigneDropdownmenu(entryId, text, functionToRun){
        if(document.getElementById("ownScripts_dropdown_entries") == null){
            let newWindow = document.createElement("li");
            newWindow.setAttribute("class","dropdown");
            newWindow.setAttribute("id","ownScripts_dropdown");

            newWindow.innerHTML = `
                       <a href="#" id="skripte_profile" role="button" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="true">
                         <span>Skripte</span>
                         <span class="visible-xs">
                           Skripte
                         </span>
                         <b class="caret"></b>
                       </a>
                       <ul class="dropdown-menu" role="menu" aria-labelledby="menu_profile" id="ownScripts_dropdown_entries"></ul>`;

            document.getElementById("news_li").before(newWindow);
        }

        let newWindow = document.createElement("li");
        newWindow.setAttribute("role","presentation");

        newWindow.innerHTML = `
        <a href="#" id="` + entryId + `" role="menuitem">` + text + `</a>`;

        document.getElementById("ownScripts_dropdown_entries").append(newWindow);

        document.getElementById(entryId).onclick = function() { functionToRun(); event.preventDefault(); return false;};
    }


    function delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
