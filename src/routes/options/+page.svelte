<script lang="ts">
	import { onMount } from "svelte";

    interface SelectorConfig {
        id: number;
        domain: string;
        calculationMode: 'single' | 'multiple';
        yearSelector: string;
        odometerSelector: string;
        priceSelector: string;
        carSelector: string; // For multiple listings
    }

    // Default presets
    let yearlyOdometer = $state(12);
    let haggle = $state(15);
    let typicalLife = $state(15);

    // Website-specific selector configurations
    let selectorConfigs = $state<SelectorConfig[]>([]);

    let statusText = $state('');
    let redFlags = $state("salvage,rebuilt,r title,accident,crash,branded")
    let blackList = $state({})

    let currentyear = $state(new Date().getFullYear())
    if (new Date().getMonth() + 1 > 8){
        currentyear++
    }

    let alwaysSort = $state(false)
    let alwaysVinCheck = $state(false)
    let vinProvider = $state("https://www.nicb.org/vincheck?vin=%s")

    onMount(async () => {
        // Load saved settings when the component mounts
        let result = await browser.storage.sync.get(['yearlyOdometer', 'haggle', 'typicalLife', 'selectorConfigs','currentyear', 'redFlags', 'vinProvider', 'alwaysVinCheck', 'alwaysSort', "blackList"])
        if (result.yearlyOdometer) yearlyOdometer = result.yearlyOdometer;
        if (result.haggle) haggle = result.haggle;
        if (result.typicalLife) typicalLife = result.typicalLife;
        if (result.selectorConfigs) selectorConfigs = result.selectorConfigs;
        else {
            const response = await fetch('/sample-settings.json');
            const sampleSettings = await response.json();
            selectorConfigs = sampleSettings.selectorConfigs;
        }
        if (result.currentyear) currentyear = result.currentyear
        if (result.redFlags) redFlags = result.redFlags
        if (result.vinProvider) vinProvider = result.vinProvider
        if (result.alwaysVinCheck) alwaysVinCheck = result.alwaysVinCheck
        if (result.alwaysSort) alwaysSort = result.alwaysSort
        if (result.blackList) blackList = result.blackList
    });

    function saveSettings() {
        // Filter out any empty domain rows before saving
        selectorConfigs = selectorConfigs.filter(c => c.domain.trim() !== '')
        selectorConfigs.sort((a,b: SelectorConfig) => {
            let dif = a.domain.localeCompare(b.domain)
            if ( dif < 0) return -1 
            else if (dif == 0 && a.calculationMode == "single") return -1
            else return 1
        })
        var toSave = {
            yearlyOdometer,
            haggle,
            typicalLife,
            currentyear,
            redFlags,
            vinProvider,
            alwaysVinCheck,
            alwaysSort,
            blackList,
            selectorConfigs
        }
        browser.storage.sync.set($state.snapshot(toSave))
        // browser.runtime.sendMessage({action: "saveToStorage", data: $state.snapshot(toSave)});
        statusText = 'Options saved.';
        setTimeout(() => { statusText = ''; }, 1500);
        console.log(toSave)
    }

    function addSite() {
        selectorConfigs.push({
            id: Date.now(), // Simple unique ID
            domain: '',
            calculationMode: 'single',
            yearSelector: '',
            odometerSelector: '',
            priceSelector: '',
            carSelector: 'body'
        });
    }

    function removeSite(id: number) {
        selectorConfigs = selectorConfigs.filter(c => c.id !== id);
    }

    function downloadSettings() {
        browser.storage.sync.get(['carPresets']).then((result) => {
            // if (result.carPresets) {
            //     carPresets = result.carPresets;
            // }
            // if (result.life) life = result.life;
            const settings = {
                yearlyOdometer,
                haggle,
                typicalLife,
                currentyear,
                redFlags,
                vinProvider,
                alwaysVinCheck,
                alwaysSort,
                blackList,
                selectorConfigs: selectorConfigs.filter(c => c.domain.trim() !== '')
            };
            let all = {
                cars:result.carPresets,
                settings
            }
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(all, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href",     dataStr);
            downloadAnchorNode.setAttribute("download", `car-calculator-settings-${new Date().getTime()}.json`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            statusText = 'Settings and cars saved successfully.';
        })
    }

    function restoredSettings(){
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        var { settings, cars } = JSON.parse(event.target?.result as string)
                        // ({ yearlyOdometer, haggle, typicalLife, currentyear, selectorConfigs } = settings); 
                        yearlyOdometer = settings.yearlyOdometer;
                        haggle = settings.haggle;
                        typicalLife = settings.typicalLife;
                        currentyear = settings.currentyear;
                        selectorConfigs = settings.selectorConfigs;
                        redFlags = settings.redFlags;
                        vinProvider = settings.vinProvider;
                        alwaysVinCheck = settings.alwaysVinCheck;
                        alwaysSort = settings.alwaysSort;
                        blackList = settings.blackList
                        browser.storage.sync.set({settings, carPresets: cars});
                        saveSettings()
                        // console.log(settings)
                        // console.log(cars)
                        statusText = 'Settings and cars restored successfully.';
                        console.log(statusText)
                    } catch (error) {
                        statusText = 'Error restoring settings. Invalid file format.';
                        console.error(error);
                    }
                    setTimeout(() => { statusText = ''; }, 3000);
                };
                reader.readAsText(file);
            }
        };
        input.click();
        input.remove();
    }
</script>

<main>
    <h1>Car Calculator Presets</h1>
    <p>These values will be used as defaults in the calculator.</p>
    <div class="preset-grid">
        <label><span>Current Year of Models</span><input type="number" bind:value={currentyear}></label>
        <label><span>Default Yearly Odometer (thou)</span><input type="number" bind:value={yearlyOdometer}></label>
        <label><span>Default Haggle Down %</span><input type="number" bind:value={haggle}></label>
        <label><span>Default Expected Lifespan</span><input type="number" bind:value={typicalLife}></label>
        <label><span>Red Flags (comma-separated)</span><textarea bind:value={redFlags}></textarea></label>
        <label><span>VinCheck site (%s for VIN)</span><input bind:value={vinProvider}></label>
        <label><span>Always VinCheck Single?</span><input type="checkbox" bind:checked={alwaysVinCheck}></label>
        <label><span>Always sort Multiple?</span><input type="checkbox" bind:checked={alwaysSort}></label>
        <button style="width: 10em;" onclick={() => blackList = {}}>Clear Blacklist</button>
    </div>

    <hr />

    <h2>Website Selectors</h2>
    <p>Add CSS selectors for the websites you browse. The domain should be a simple part of the URL (e.g., "cars.com").</p>
    <p>Css Selectors order is as follows: listing, year, miles, price</p>
    {#each selectorConfigs as config (config.id)}
        <div class="site-config">
            <input type="text" placeholder="Domain (e.g., cars.com)" bind:value={config.domain} />
            
            <div class="radio-group">
                <label><input type="radio" bind:group={config.calculationMode} value='single'> Single</label>
                <label><input type="radio" bind:group={config.calculationMode} value='multiple'> Multiple</label>
            </div>

            <input type="text" title="Car Element Selector" placeholder="Car Element Selector" bind:value={config.carSelector} />
            <input type="text" title="Year Selector" placeholder="Year Selector" bind:value={config.yearSelector} />
            <input type="text" title="Odometer Selector" placeholder="Odometer Selector" bind:value={config.odometerSelector} />
            <input type="text" title="Price Selector" placeholder="Price Selector" bind:value={config.priceSelector} />
            <button class="remove-btn" onclick={() => removeSite(config.id)}>Remove</button>
        </div>
    {/each}

    <button onclick={addSite}>Add New Site</button>

    <hr />

    <div style="display: flex;">
        <button onclick={saveSettings}>Save</button>
        <button onclick={downloadSettings}>Download Settings</button>
        <button onclick={restoredSettings}>Restore Settings</button>
        <a href="https://github.com/enaaab460/car-cost-calculator" style="display: inline-block;"><img src="https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png" style="height: 2em;" alt="github"></a>
    </div>
    <div id="status">{statusText}</div>
</main>

<style>
    main { 
        padding: 1em;
        width: fit-content;
    }
    .preset-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.5em;
        margin-bottom: 1em;
    }
    .site-config {
        /* display: grid; */
        /* grid-template-columns: 1fr 1fr 1fr auto; */
        gap: 0.5em;
        margin-bottom: 2em;
        align-items: center;
        /* border-bottom: solid 1px black; */
    }
    .remove-btn {
        background-color: #f44336;
        color: white;
        border: none;
        padding: 8px 12px;
        cursor: pointer;
    }
    hr {
        margin: 1.5em 0;
    }
    #status {
        margin-top: 1em;
        color: green;
    }
</style>