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


async function fetchAllVehiclesV2() {
    let url = "https://www.leitstellenspiel.de/api/v2/vehicles?limit=3000";
    let allVehicles = [];

    while (url) {
        console.log("Loading:", url);

        const res = await fetchWithRetry(url, 5, 1500); // 5 retries, 1.5s delay
        const data = await res.json();

        allVehicles.push(...data.result);
        url = data.paging.next_page; // go to next page
    }

    console.log("Total vehicles loaded:", allVehicles.length);
    return allVehicles;
}

async function fetchWithRetry(url, retries = 5, delayMs = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            //const res = await fetch(url);
            const res = await fetch(url, {"_method": "get", "authenticity_token": $("meta[name=csrf-token]").attr("content") });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            return res; // success → return response
        } catch (err) {
            console.warn(`Fetch failed (${i + 1}/${retries}):`, err);

            if (i === retries - 1) {
                throw err; // give up after last try
            }

            // wait before retrying
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
}
