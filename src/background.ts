import type { SelectorConfig } from "$lib";
type getCarDataModes = "single" | "multiple" | "red-flags"

type BlackList = { [domain: string]: string[] };
type ScrapedMultipleUnit = {name: string, link: string ,age: number, price: number, yearsAgo: number, odometer: number, res: number}

interface FlagParent extends HTMLElement{
    flags: Set<string>
    defColor: string
    defTitle: string
}

interface CarEl extends HTMLElement {
    diffNum: number
}

chrome.runtime.getPlatformInfo().then(({os}) => {
    if (os != "android"){
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
            if (!tab) return
            if (info.menuItemId === "get-car-data-single") {
                getCarData('single', tab);
            } else if (info.menuItemId === "get-red-flags") {
                getCarData('red-flags', tab);
            } else if (info.menuItemId === "get-car-data-multiple") {
                getCarData('multiple', tab);
            } else if (info.menuItemId === "sort-cars") {
                sortCars(tab)
            } else if (info.menuItemId === "clear-black-list") {
                clearBlackList(tab)
            } else if (info.menuItemId === "black-list-listing" && info.linkUrl){
                blackListLink(info.linkUrl, tab)
            }
        });

        chrome.commands.onCommand.addListener((command, tab) => {
            if (!tab || !command) return
            if (command === "get-car-data-single") {
                getCarData('single', tab);
            } else if (command === "get-car-data-multiple") {
                getCarData('multiple', tab);
            } 
        });
    }
})


chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
    let [message, tab] = msg
    if (message === "get-car-data-single") {
        getCarData('single', tab).then(res => sendResponse(res))
    } else if (message === "get-red-flags") {
        getCarData('red-flags', tab)
    } else if (message === "get-car-data-multiple") {
        getCarData('multiple', tab).then(res => sendResponse(res))
    } else if (message === "get-car-data-multiple-append") {
        getCarData('multiple', tab, true).then(res => sendResponse(res))
    } else if (message === "sort-cars") {
        sortCars(tab)
    }
    return true
});

async function getCarData(mode: getCarDataModes, tab: chrome.tabs.Tab, append = false) {
    if (!tab.url) return
    const keys = ['yearlyOdometer', 'haggle', 'life', 'selectorConfigs', 'selectedCarName', 'selectedCarCost', 'selectedCarLife', 'currentyear', 'redFlags', 'alwaysSort', 'vinProvider', 'recallProvider', 'blackList'];
    var result = await chrome.storage.sync.get(keys)
    if (!result || !result.yearlyOdometer) {
        chrome.runtime.openOptionsPage();
        return
    }
    const yearlyOdometer = result.yearlyOdometer as number;
    const haggle = result.haggle as number;
    let life = result.life as number;
    let cost = 0;
    const name = result.selectedCarName as string;
    let redFlags = result.redFlags as string;
    let currentyear = result.currentyear as number;
    let alwaysSort = result.alwaysSort as boolean;
    let vinProvider = result.vinProvider as string;
    let recallProvider = result.recallProvider as string;
    const blRes = await chrome.storage.local.get('blackList') as { blackList?: BlackList };
    let blackList: BlackList = blRes.blackList ?? {};
    let tabURL = new URL(tab.url)
    let domain = `${tabURL.hostname}${tabURL.pathname}`
    if (!blackList[domain]) blackList[domain] = []
    if (result.selectedCarCost) {
        cost = result.selectedCarCost as number;
    }
    if (result.selectedCarLife) {
        life = result.selectedCarLife as number;
    }
    let selectorConfigs = result.selectorConfigs as SelectorConfig[]

    let thisSelector = selectorConfigs.find((x: SelectorConfig) => tab.url?.includes(x.domain) && x.calculationMode == mode);
    if (!thisSelector && mode != "red-flags") {
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

    var res
    if (thisSelector && mode != "red-flags"){
        var results = await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: (mode: getCarDataModes, thisSelector: SelectorConfig, blackList: string[], currentyear: number, yearlyOdometer: number, life: number, cost: number, haggle: number)=>{
                // var retVal: {year: number, odometer: number, price: number} | ScrapedMultipleUnit[] | Error
                var retVal: any
                var remCount = 0
                if (mode == "multiple") {
                    retVal = []
                    console.time("blacklist")
                    for (let b of blackList){
                        let el = document.querySelector(`${thisSelector.carSelector}:has(a[href*="${b}"])`)
                        if (el) {
                            el.remove()
                            remCount++
                        }
                    }
                    console.timeEnd("blacklist")
                }
                const carElements = Array.from(document.querySelectorAll(thisSelector.carSelector)) as CarEl[];
                console.time("Price")
                carElements.forEach(el => {
                    try {
                        el.querySelector(".ext-diff")?.remove();
                        const yearElement = el.querySelector(thisSelector.yearSelector) as HTMLElement;
                        if (!yearElement) {
                            console.error(`yearElement ${thisSelector.yearSelector} not found in ${el}`);
                            return;
                        }
                        const priceElement = el.querySelector(thisSelector.priceSelector) as HTMLElement;
                        if (!priceElement) {
                            console.error(`priceElement ${thisSelector.priceSelector} not found in ${el}`);
                            return;
                        }
                        const odometerElement = el.querySelector(thisSelector.odometerSelector) as HTMLElement;
                        priceElement.style.fontStyle = "";
                        var year = 0;
                        if (yearElement) {
                            let parsedYear = yearElement.textContent.match(/\b[\d]{4}\b/)
                            if (parsedYear) year = parseInt(parsedYear[0]);
                            if (year < 1950 || year > currentyear + 1) {
                                console.error(`Unsupported year ${year}`)
                                return
                            }
                        }
                        var priceMatch = priceElement.textContent.replaceAll(',', '').match(/\$(\d+)(\.\d+)?/);
                        if (!priceMatch) {
                            priceMatch = priceElement.textContent.replaceAll(',', '').match(/\$?(\d+)(\.\d+)?/);
                        }
                        if (!priceMatch) {
                            console.error(`priceMatch not found in ${el}`);
                            return
                        }
                        const price = parseInt(priceMatch[1]);
                        var odometer = 0;
                        if (odometerElement) {
                            // innerText is empty in cars.com, so switching to textContent
                            // textContent messes newlines so craigslist doesn't work
                            var odText = odometerElement.innerText?.trim().toLowerCase().replaceAll(',', '');
                            if (!odText) odText = odometerElement.textContent?.toLowerCase().replaceAll(',', '');
                            if (odText){
                                var odometerMatch = odText.match(/(\d+)(\.\d+)?k?( (mi|km))/);
                                if (!odometerMatch) odometerMatch = odText.match(/(\d+)(\.\d+)?k?/);
                                if (odometerMatch) {
                                    odometer = parseInt(odometerMatch[1]);
                                    if (odText.search(/k(?!m)/) != -1) odometer = odometer * 1000;
                                }
                            }
                        }
                        var old = 0
                        if (year && odometer) old = ((currentyear - year) + (odometer / yearlyOdometer)) / 2;
                        else if (year) old = currentyear - year
                        else if (odometer) old = odometer / yearlyOdometer
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
                        priceElement.style.setProperty("color", color, "important");
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
                            let thisCar: ScrapedMultipleUnit = {name: yearElement.textContent.trim(), link: el.querySelector("a")?.href! ,age: Math.round(old * 10) / 10, price: price, yearsAgo: currentyear - year, odometer: odometer, res}
                            retVal.push(thisCar)
                        }else retVal = { year, odometer, price }
                        el.diffNum = price - res
                        priceElement.append(tempEl);
                    } catch (error) {
                        console.error(error);
                        retVal = error
                    }
                });
                if (mode == "multiple") retVal.push(remCount)
                console.timeEnd("Price")
                return retVal
            },
            args: [mode, thisSelector, blackList[domain], currentyear, yearlyOdometer * 1000, life, cost * 1000, haggle]
        })
        console.log(results)
        if (results && results[0]) {
            res = results[0].result
            if (res) {
                if (mode === 'single'){
                    await chrome.storage.sync.set({'scrapedSingle': res });
                } else {
                    if (append) {
                        let { scrapedMultiple } = await chrome.storage.local.get("scrapedMultiple") as { scrapedMultiple: ScrapedMultipleUnit[]}
                        if (scrapedMultiple) {
                            res.push(...scrapedMultiple)
                            res = Array.from(new Map(res.map((item: ScrapedMultipleUnit) => [item.link, item])).values())
                        }
                    }
                    let remCount = res.pop() as number
                    if (remCount > 0) {
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icons/icon-48x48.png',
                            title: `Removed ${remCount} blacklisted listings`,
                            message: `Total ${blackList[domain].length} blacklisted listings`
                        });
                    }
                    await chrome.storage.local.set({ 'scrapedMultiple': res })
                }
            }
        }
        if (mode == "multiple" && alwaysSort) sortCars(tab)
    }
    if (mode != "multiple"){
        var foundRedFlags = await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: async (mode: getCarDataModes, redFlags: string, thisSelector: any, vinProvider: string, recallProvider: string, name: string, odometer: number)=>{
                var retVal: any[] = []
                var flags = new Set()
                const redFlagsRegex = new RegExp(redFlags, 'gi');
                const baseExcludeSelectors = 'script, style, #ext-stats';
                const excludeSelector = thisSelector.excludeSelector ? `${baseExcludeSelectors}, ${thisSelector.excludeSelector}` : baseExcludeSelectors;
                var redText: {text: string, flags: Set<string>}[] = []
                document.querySelector("#ext-stats")?.remove()
                // Walker GEMINI (modified)
                function processNode(n: Node, walker: TreeWalker) {
                    let node = n as CharacterData
                    var text = node.textContent;
                    if (!text) return;
                    text = text.trim()
                    if (!text) return;

                    const matches = text.toLowerCase().match(redFlagsRegex);
                    if (!matches) return;

                    let parent = node.parentElement as FlagParent
                    if (!parent) return
                    if (parent.closest(excludeSelector)) return;
                    if (parent.tagName.includes("SCRIPT")) return;

                    for (let j of [{l:"\n",e:"p"},{l:".",e:"span"}]){
                        if (text.includes(j.l)){
                            let newNodes = text.split(j.l).map(x=>{
                                let s = document.createElement(j.e)
                                s.innerText = x
                                return s
                            })
                            node.replaceWith(...newNodes)
                            walker.currentNode = newNodes[0]
                            return true
                        }
                    }
                    let parentFlags = new Set(parent.flags)
                    var nFlags: Set<string> = new Set()
                    for (const match of matches) {
                        const flag = match.toLowerCase();
                        nFlags.add(flag)
                        flags.add(flag);
                        parentFlags.add(flag);
                    }

                    parent.flags = parentFlags
                    parent.defColor = parent.style.color
                    parent.defTitle = parent.title
                    parent.style.setProperty("color", "red", "important");
                    parent.classList.add("ext-redFlags");
                    parent.title = Array.from(parentFlags).join(', ');
                    redText.push({text,flags: nFlags})
                    console.log(parent, text, parentFlags)
                }
                console.time("redFlags");
                const scopes = document.querySelectorAll(thisSelector.carSelector) || [document.body];
                scopes.forEach(scope => {
                    const treeWalker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
                    var here = treeWalker.nextNode()
                    while (here) {
                        if (!processNode(here, treeWalker)) here = treeWalker.nextNode()
                    }
                })
                console.timeEnd("redFlags");
                document.addEventListener('contextmenu', function handleContextMenu(e) {
                    const flaggedElement = (e.target! as FlagParent).closest('.ext-redFlags') as FlagParent | null;
                    if (flaggedElement) {
                        e.preventDefault();
                        // TODO: Fix
                        flaggedElement.title = flaggedElement.defTitle ?? ""
                        flaggedElement.style.color = flaggedElement.defColor ?? ""
                        flaggedElement.classList.remove("ext-redFlags");
                    }
                });
                let myStats = document.createElement("div")
                myStats.id = "ext-stats"
                myStats.style = "position: fixed; right: 0px; top: 0px; z-index: 99999;font-size: 2em; background: white;"
                // myStats.oncontextmenu = (e) => {e.preventDefault(); myStats.remove()}
                document.querySelector("body")!.append(myStats)
                if (flags.size > 0){
                    retVal = Array.from(flags)
                    let msg = `Red Flags: ${retVal}`
                    if (!document.querySelector('#ext-danger')){
                        let danger = document.createElement("div")
                        danger.id = "ext-danger"
                        danger.style = "color: red;"
                        let l = document.createElement("a")
                        l.onclick = async () => {
                            for (let e of document.querySelectorAll('.ext-redFlags,a[href*="carfax"],a[href*="autocheck"]')){
                                // if (e instanceof HTMLAnchorElement && e.href.includes("download")) continue
                                let grandParent = e.parentElement as HTMLElement
                                while (grandParent.getBoundingClientRect().height < 1) grandParent = grandParent.parentElement!
                                if (e.getBoundingClientRect().height > 0) e.scrollIntoView({block: "center"})
                                else grandParent.scrollIntoView({block: "center"})
                                grandParent.style.setProperty("border","solid red 1px", "important")
                                await new Promise(resolve => setTimeout(resolve, 1000))
                                // if (e.getBoundingClientRect().height > 0) grandParent.style.border = ""
                            }
                        }
                        l.textContent = "Red Flags: "
                        l.oncontextmenu = (e) => {e.preventDefault(); danger.remove()}
                        danger.append(l)
                        for (let r of retVal){
                            let l = document.createElement("span")
                            if (r == retVal.at(-1)) l.textContent = r
                            else l.textContent = `${r}, `
                            l.oncontextmenu = (e) => {e.preventDefault(); l.remove()}
                            danger.append(l)
                        }
                        myStats.append(danger)
                    }
                    alert(`${msg}\n~~~\n\n${redText.map(x=> `${x.text} [${String(Array.from(x.flags))}]`).join("\n___\n")}`)
                }
                let vins = (Array.from(document.querySelectorAll(thisSelector.carSelector)) as HTMLElement[])?.map(n => n.innerText.match(/\b[\w\d]{17}\b/)).filter(Boolean) as RegExpMatchArray[]
                if (vins && vinProvider && recallProvider){
                    let vin = vins[0][0]
                    for (let x of [
                        {n: "Title", v: vinProvider.replace("%s",vin)},
                        {n: "KBB", v: `https://www.kbb.com/mazda/cx-5/2023/vin/?intent=trade-in-sell&vin=${vin}&mileage=${odometer}`},
                        {n: "Recall", v: recallProvider.replace("%s", vin)}
                    ]){
                        let check = document.createElement("a")
                        check.style.display = "block"
                        check.textContent = "Check " + x.n
                        check.href = x.v
                        check.target = "_blank"
                        myStats.append(check)
                    }
                }
                return retVal
            },
            args: [mode, redFlags, thisSelector ? thisSelector : {carSelector:"body"}, vinProvider, recallProvider, name, res ? res.odometer : 0]
            // args: [mode, redFlags, thisSelector]
        }) as any
        console.log(foundRedFlags)
        if (foundRedFlags && foundRedFlags.result){
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-128x128.png',
                title: `Page contains red flag keyword`,
                message: `Check red text for ${(foundRedFlags.result)}`
            });
        }
    }
    return res
}


async function sortCars(tab: chrome.tabs.Tab) {
    var {selectorConfigs} = await chrome.storage.sync.get("selectorConfigs") as { selectorConfigs: SelectorConfig[]}
    if (!selectorConfigs) {
        chrome.runtime.openOptionsPage();
        return
    }
    if (!tab.url) return
    let thisSelector = selectorConfigs.find((x: any) => tab.url?.includes(x.domain) && x.calculationMode == "multiple");
    if (!thisSelector) return
    await chrome.scripting.executeScript({target: { tabId:  tab.id! },func: (elSelector)=>{
        if (!document.querySelector(".ext-diff")) return
        console.time("sort")
        let toSort = Array.from(document.querySelectorAll(`${elSelector}:has(.ext-diff)`)) as HTMLElement[]
        toSort = toSort.sort((a: any, b: any) => a.diffNum > b.diffNum ? -1 : 1)
        let parentEl = toSort[0].parentElement as HTMLElement
        for (let s of toSort){
            s.style.order = ""
            parentEl.prepend(s)
        }
        console.timeEnd("sort")
        parentEl.children[0].scrollIntoView()
    }, args:[thisSelector.carSelector]})
}

async function blackListLink(link: string, tab: chrome.tabs.Tab){
    if (!tab.url) return
    var {selectorConfigs} = await chrome.storage.sync.get(["selectorConfigs"]) as { selectorConfigs: SelectorConfig[] }
    if (!selectorConfigs) {
        chrome.runtime.openOptionsPage();
        return
    }
    const blLocal = await chrome.storage.local.get(["blackList"]) as { blackList?: BlackList }
    let blackList: BlackList = blLocal.blackList ?? {}
    let tabURL = new URL(tab.url)
    let domain = `${tabURL.hostname}${tabURL.pathname}`
    let cleanLink = new URL(link).pathname
    if (!blackList) blackList = {}
    if (!blackList[domain]) blackList[domain] = []
    if (!blackList[domain].includes(cleanLink)) blackList[domain].push(cleanLink)
    await chrome.storage.local.set({blackList: blackList})
    let thisSelector = selectorConfigs.find((x: SelectorConfig) => tab.url?.includes(x.domain) && x.calculationMode == "multiple");
    if (!thisSelector) return
    await chrome.scripting.executeScript({target: { tabId: tab.id! },func: (thisSelector: any, link: string)=>{
        document.querySelector(`${thisSelector}:has(a[href*="${link}"])`)?.remove()
    }, args:[thisSelector.carSelector, cleanLink]})
}

async function clearBlackList(tab: chrome.tabs.Tab) {
    if (!tab.url) return
    // if (!confirm("Are you sure?")) return
    const blRes = await chrome.storage.local.get("blackList") as { blackList?: BlackList }
    let blackList: BlackList = blRes.blackList ?? {}
    if (!Object.keys(blackList).length) return
    let tabURL = new URL(tab.url)
    let domain = `${tabURL.hostname}${tabURL.pathname}`
    if (blackList[domain]) blackList[domain] = []
    await chrome.storage.local.set({blackList})
}