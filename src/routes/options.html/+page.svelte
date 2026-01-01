<script lang="ts">
	import { onMount } from "svelte";

    // Default presets
    let yearlyOdometer = $state(10);
    let haggle = $state(15);
    let typicalLife = $state(15);

    let currentyear = $state(new Date().getFullYear())
    if (new Date().getMonth() + 1 > 8){
        currentyear++
    }
    let statusText = $state('');
    onMount(() => {
        // Load saved settings when the component mounts
        var settings = localStorage.getItem("settings")
        if (settings) ({yearlyOdometer, haggle, typicalLife, currentyear} = JSON.parse(settings))
        document.onkeydown = (e) => {
            if (e.key == "s" && e.ctrlKey){
                e.preventDefault()
                saveSettings()
            }
        }
    });

    function saveSettings() {
        // Filter out any empty domain rows before saving
        var settings = {
            yearlyOdometer,
            haggle,
            typicalLife,
            currentyear,
        }
        localStorage.setItem("settings", JSON.stringify(settings))
        statusText = 'Options saved.';
        setTimeout(() => { statusText = ''; }, 1500);
        console.log(settings)
    }

    async function downloadSettings() {
        let carPresets = JSON.parse(localStorage.getItem("carPresets")??"[]")
        var settings: any = {
            yearlyOdometer,
            haggle,
            typicalLife,
            currentyear,
        }
        var all: any = {
            settings,
        }
        if (carPresets){
            all.carPresets = carPresets
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(all, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", `car-calculator-settings-${new Date().getTime()}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        statusText = 'Settings and cars saved successfully.';
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
                        var result = JSON.parse(event.target?.result as string)
                        let settings = result.settings
                        if (settings){
                            ({ yearlyOdometer, haggle, typicalLife, currentyear } = settings); 
                            // yearlyOdometer = settings.yearlyOdometer;
                            // haggle = settings.haggle;
                            // typicalLife = settings.typicalLife;
                            // currentyear = settings.currentyear;
                        }
                        let carPresets = result.carPresets
                        localStorage.setItem("carPresets", JSON.stringify(carPresets))
                        localStorage.setItem("settings", JSON.stringify(settings))
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
    </div>

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
    hr {
        margin: 1.5em 0;
    }
    #status {
        margin-top: 1em;
        color: green;
    }
    .preset-grid > label {
        display: flex;
        justify-content: space-between;
    }
</style>