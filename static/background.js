// static/background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "get-car-data-single",
    title: "Single Car",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "get-car-data-multiple",
    title: "Multiple Cars",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "sort-cars",
    title: "Sort Cars",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "clear-black-list",
    title: "Clear this Black list ",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "black-list-listing",
    title: "Black list listing",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "get-car-data-single") {
    getCarData('single');
  } else if (info.menuItemId === "get-car-data-multiple") {
    getCarData('multiple');
  } else if (info.menuItemId === "sort-cars") {
    sortCars()
  } else if (info.menuItemId === "clear-black-list") {
    clearBlackList(tab)
  } else if (info.menuItemId === "black-list-listing"){
    blackListLink(info.linkUrl, tab)
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "get-car-data-single") {
    getCarData('single');
  } else if (command === "get-car-data-multiple") {
    getCarData('multiple');
  } 
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
    if (message === "get-car-data-single") {
        sendResponse(getCarData('single'))
    } else if (message === "get-car-data-multiple") {
        sendResponse(getCarData('multiple'));
    } else if (message === "sort-cars") {
        sortCars()
    }
});

async function getCarData(mode) {
    // if (!tab.id) return;
    var tab = await chrome.tabs.query({active: true, currentWindow: true})
    tab = tab[0]
    if (!tab) return
    let tabId = tab.id
    chrome.storage.sync.remove("scrapedSingle")
    const keys = ['yearlyOdometer', 'haggle', 'life', 'selectorConfigs', 'selectedCarName', 'selectedCarCost', 'selectedCarLife', 'scrapedSingle', 'scrapedMultiple', 'currentyear', 'redFlags', 'alwaysSort', 'alwaysVinCheck', 'vinProvider'];
    var result = await chrome.storage.sync.get(keys)
    if (!result) return
    const yearlyOdometer = result.yearlyOdometer || 12;
    const haggle = result.haggle || 15;
    let life = result.life || 15;
    let cost = 0;
    const name = result.selectedCarName;
    let redFlags = result.redFlags || "";
    let currentyear = result.currentyear;
    let alwaysSort = result.alwaysSort;
    let alwaysVinCheck = result.alwaysVinCheck;
    let vinProvider = result.vinProvider;
    if (!currentyear){
        currentyear = new Date().getFullYear();
        if (new Date().getMonth() + 1 > 8){
            currentyear++;
        }
    }
    if (result.selectedCarCost) {
        cost = result.selectedCarCost;
    }
    if (result.selectedCarLife) {
        life = result.selectedCarLife;
    }
    let selectorConfigs = result.selectorConfigs
    // if (!selectorConfigs){
    //     chrome.notifications.create({
    //         type: 'basic',
    //         iconUrl: 'icons/icon-128x128.png',
    //         title: 'No Website Presets',
    //         message: 'Check settings'
    //         // message: `Using ${mode} mode on data from calculator`
    //     });
    //     // return
    // }

    let thisSelector = selectorConfigs.find(x => tab.url.includes(x.domain) && x.calculationMode == mode);
    if (!thisSelector) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-128x128.png',
            title: 'Website + Mode combination not registered',
            message: 'Check settings'
        });
        // return;
    } else

    if (cost == 0 || life == 0){
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-128x128.png',
            title: `Wrong Preset`,
            message: `Cost and Life cannot be 0`
        });
        return
    } else

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128x128.png',
        title: `${name ? name : "Custom"}`,
        message: `Using ${mode} mode`
    });

    var results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectedFunction,
        args: [mode, currentyear, cost * 1000, haggle, life, yearlyOdometer, thisSelector, redFlags, alwaysVinCheck, vinProvider, result.scrapedMultiple]
    })
    console.log(results)
    if (results && results[0] && results[0].result) {
        if (mode === 'single'){
            chrome.storage.sync.set({ 'scrapedSingle': results[0].result });
            if (results[0].result.redFlags){
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon-128x128.png',
                    title: `Page contains red flag keyword`,
                    message: `Check red text for ${(results[0].result.redFlags)}`
                });
            }
        } else {
            chrome.storage.local.set({ 'scrapedMultipleNew': results[0].result });
        }
    }
    if (mode == "multiple" && alwaysSort) sortCars()
    return results[0].result
}

async function injectedFunction(mode, currentyear, cost, haggle, life, yearlyOdometer, thisSelector, redFlags, alwaysVinCheck, vinProvider, scrapedMultiple) {
    var retVal = {}
    if (mode == "multiple") retVal = []
    if (thisSelector){
        const carElements = document.querySelectorAll(thisSelector.carSelector);
        console.time("Price")
        carElements.forEach(el => {
            try {
                el.querySelector(".ext-diff")?.remove();
                const yearElement = el.querySelector(thisSelector.yearSelector);
                if (!yearElement) {
                    console.error(`yearElement ${thisSelector.yearSelector} not found in ${el}`);
                    return;
                }
                const priceElement = el.querySelector(thisSelector.priceSelector);
                if (!priceElement) {
                    console.error(`priceElement ${thisSelector.priceSelector} not found in ${el}`);
                    return;
                }
                const odometerElement = el.querySelector(thisSelector.odometerSelector);
                // if (!odometerElement) {
                //     console.error(`odometerElement ${thisSelector.odometerSelector} not found`);
                //     return;
                // }
                priceElement.style.fontStyle = "";
                var year = 0;
                if (yearElement) {
                    year = parseInt(yearElement.textContent.match(/\d+/)[0]);
                }
                const priceMatch = priceElement.textContent.replaceAll(',', '').match(/\$?(\d+)(\.\d+)?/);
                if (!priceMatch) return;
                const price = parseInt(priceMatch[1]);
                var odometer = 0;
                if (odometerElement) {
                    var odText = odometerElement.textContent.toLowerCase();
                    const odometerMatch = odText.replaceAll(',', '').match(/(\d+)(\.\d+)?k?( (mi|km))?/);
                    if (!odometerMatch) return;
                    odometer = parseInt(odometerMatch[1]);
                    if (!odText.includes("k")) odometer = odometer / 1000;
                }
                var old = ((currentyear - year) + odometer / yearlyOdometer) / 2;
                var costFrac = Math.pow(1 - 2 / life, old)
                var res = Math.round(cost * costFrac);
                var beHaggle = Math.round(res / (1 - haggle / 100));
                var afHaggle = Math.round(res * (1 - haggle / 100));
                var color;
                if (price <= res * 1 / 2) color = "yellow";
                else if (price <= afHaggle) color = "green";
                else if (price <= res) color = "cyan";
                else if (price <= beHaggle) color = "purple";
                else if (price <= res * 3 / 2) color = "red";
                else color = "saddlebrown"
                priceElement.style.color = color;
                if (old > life) priceElement.style.textDecoration = "line-through";
                else if (old / life > 2 / 4) priceElement.style.textDecoration = "underline";
                else if (old / life < 1 / 4) priceElement.style.fontStyle = "italic";
                var tempEl = document.createElement("span");
                tempEl.className = "ext-diff";
                tempEl.textContent = ` (${price > res ? '+' : ''}${String(price - res)})`;
                priceElement.title = `${price > res ? '+' : ''}${Math.round((price - res)/res*100)}% (${Math.round(price/cost*100)}% of new) \r\n` + 
                    `${String(res)} (${Math.round(costFrac*100)}% of new) \r\n` + 
                    `${old.toFixed(1)} y/o (${Math.round(old / life * 100)}% of life)`;
                if (mode == "multiple") {
                    el.title = priceElement.title
                    retVal.push({name: yearElement.textContent.trim(), link: el.querySelector("a").href ,age: Math.round(old * 10) / 10, price: price, yearsAgo: currentyear - year, odometer: odometer * 1000, res})
                }else retVal = { year, odometer, price }
                el.diffNum = price - res
                priceElement.append(tempEl);
            } catch (error) {
                console.error(error);
                retVal = error
            }
        });
        console.timeEnd("Price")
    } else thisSelector = {carSelector: "body"}
    if (mode == "single"){
        redFlags = redFlags.toLowerCase().split(/ ?, ?/)
        flags = new Set()
        function checkChildren(el){
            if (!el.tagName) return
            if (el.tagName == "SCRIPT" || el.tagName == "STYLE" || el.id == "ext-danger") return
            if (el.getBoundingClientRect().height < 1) return
            for (let x of el.childNodes){
                if (x.nodeName == "#text"){
                    text = x.textContent.trim().toLowerCase()
                    if (!text) continue
                    for (r of redFlags){
                        if (text.includes(r)){
                            if (!el.flags) el.flags = []
                            if (!el.flags.includes(r)) el.flags.push(r)
                            flags.add(r)
                        }
                    }
                    if (el.flags){
                        console.log(el, el.flags)
                        el.style.color = "red"
                        el.classList.add("ext-redFlags")
                        el.title = el.flags
                        el.oncontextmenu = (e) => {
                            e.preventDefault()
                            el.style.color = ""
                            el.title.remove()
                            el.classList.remove("ext-redFlags")
                            el.oncontextmenu.remove()
                        }
                    }
                } else checkChildren(x)
            }
        }
        console.time("redFlags")
        checkChildren(document.querySelector(thisSelector.carSelector))
        console.timeEnd("redFlags")
        var myStats
        if (!document.querySelector('#ext-stats')) {
            myStats = document.createElement("div")
            myStats.id = "ext-stats"
            myStats.style = "position: fixed; right: 0px; top: 0px; z-index: 99999;font-size: 2em; background: white;"
            myStats.oncontextmenu = (e) => {e.preventDefault(); myStats.remove()}
            document.querySelector("body").append(myStats)
        }
        if (flags.size > 0){
            retVal.redFlags = Array.from(flags)
            let msg = `Red Flags: ${retVal.redFlags}`
            if (!document.querySelector('#ext-danger')){
                let danger = document.createElement("div")
                danger.id = "ext-danger"
                danger.style = "color: red;"
                let l = document.createElement("span")
                l.textContent = "Red Flags: "
                l.oncontextmenu = (e) => {e.preventDefault(); danger.remove()}
                danger.append(l)
                for (let r of retVal.redFlags){
                    let l = document.createElement("span")
                    if (r == retVal.redFlags.at(-1)) l.textContent = r
                    else l.textContent = `${r}, `
                    l.oncontextmenu = (e) => {e.preventDefault(); l.remove()}
                    danger.append(l)
                }
                myStats.append(danger)
            }
            alert(msg)
            for (let e of document.querySelectorAll('.ext-redFlags,a[href*="carfax.com/vehiclehistory/"]')){
                e.scrollIntoView({block: "center"})
                let grandParent = e.parentElement.parentElement
                grandParent.style.border = "solid red 2px"
                await new Promise(resolve => setTimeout(resolve, 1000))
                grandParent.style.border = ""
            }
        }
        let vin = document.querySelector(thisSelector.carSelector).innerText.match(/\b[\w\d]{17}\b/)
        if (vin){
            vin = vin[0]
            var check = document.getElementById("ext-checkTitle")
            if (!check){
                check = document.createElement("a")
                check.textContent = "Check Title"
                check.id = "ext-checkTitle"
                myStats.append(check)
            }
            check.onclick = () => window.open(vinProvider.replace("%s",vin))
            // await navigator.clipboard.writeText(vin)
            if (alwaysVinCheck) check.click()
        }
    }
    return retVal
}

async function sortCars() {
    var {selectorConfigs, blackList} = await chrome.storage.sync.get(["selectorConfigs","blackList"])
    if (!selectorConfigs) return
    var tab = await chrome.tabs.query({active: true, currentWindow: true})
    tab = tab[0]
    if (!tab) return
    if (!blackList) blackList = {}
    let tabURL = new URL(tab.url)
    let domain = `${tabURL.hostname}${tabURL.pathname}`
    let tabId = tab.id
    let thisSelector = selectorConfigs.find(x => tab.url.includes(x.domain) && x.calculationMode == "multiple");
    if (!thisSelector) return
    let remCount = await chrome.scripting.executeScript({target: { tabId:  tabId },func: (elSelector, blackList)=>{
        if (!document.querySelector(".ext-diff")) return
        var remCount = 0
        console.time("blacklist")
        if (blackList) for (let b of blackList){
            let el = document.querySelector(`${elSelector}:has(a[href^="${b}"])`)
            if (el) {
                el.remove()
                remCount++
            }
        }
        else blackList = []
        console.timeEnd("blacklist")
        console.time("sort")
        let toSort = Array.from(document.querySelectorAll(elSelector))
        toSort = toSort.sort((a, b) => a.diffNum > b.diffNum ? -1 : 1)
        parentEl = toSort[0].parentElement
        for (let s of toSort){
            s.style.order = ""
            parentEl.prepend(s)
        }
        console.timeEnd("sort")
        parentEl.children[0].scrollIntoView()
        return [remCount, blackList.length]
    }, args:[thisSelector.carSelector, blackList[domain]]})
    if (remCount[0].result[0] > 0) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-128x128.png',
            title: `Removed ${remCount.at(0).result[0]} blacklisted listings`,
            message: `Total ${remCount.at(0).result[1]} blacklisted listings`
        });
    }
}

async function blackListLink(link, tab){
    var {blackList, selectorConfigs} = await chrome.storage.sync.get(["blackList","selectorConfigs"])
    let tabURL = new URL(tab.url)
    let domain = `${tabURL.hostname}${tabURL.pathname}`
    let cleanLink = new URL(link).pathname
    if (!blackList) blackList = {}
    if (!blackList[domain]) blackList[domain] = []
    if (!blackList[domain].includes(cleanLink)) blackList[domain].push(cleanLink)
    await chrome.storage.sync.set({blackList: blackList})
    let thisSelector = selectorConfigs.find(x => tab.url.includes(x.domain) && x.calculationMode == "multiple");
    if (!thisSelector) return
    await chrome.scripting.executeScript({target: { tabId: tab.id},func: (thisSelector, link)=>{
        document.querySelector(`${thisSelector}:has(a[href^="${link}"])`).remove()
    }, args:[thisSelector.carSelector, cleanLink]})
}

async function clearBlackList(tab) {
    // if (!confirm("Are you sure?")) return
    var { blackList } = await chrome.storage.sync.get("blackList")
    if (!blackList) return
    let tabURL = new URL(tab.url)
    let domain = `${tabURL.hostname}${tabURL.pathname}`
    if (blackList[domain]) blackList[domain] = []
    await chrome.storage.sync.set({blackList})
}