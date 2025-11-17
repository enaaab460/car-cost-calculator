<script lang="ts">
    import { Chart } from "chart.js/auto"
    import type { ChartConfiguration } from "chart.js/auto"
	import { onMount } from "svelte";

    interface CarPreset {
        id: number;
        name: string;
        msrp: number;
        life: number;
    }
    let carPresets = $state<CarPreset[]>([]);
    let yearlyOdometer = $state(12)
    let haggle = $state(15)
    let currentyear = $state(new Date().getFullYear())
    if (new Date().getMonth() + 1 > 8){
        currentyear++
    }

    let cost = $state(0)
    let life = $state(15)
    let old = $state(0)
    let year: null | number = $state(null)
    let odometer: null | number = $state(null)
    let price = $state(0)
    let name = $state("")
    let estimate = $state(0)
    let beHaggle = $state(0)
    let AfHaggle = $state(0)

    let myChart: Chart;
    let chartCanvas = $state<HTMLCanvasElement>()
    let resultText = $state("")

    onMount(async () => {
        const keys = ['yearlyOdometer', 'haggle', 'typicalLife', 'carPresets', 'scrapedData', 'yearSelector', 'odometerSelector', 'modelSelector', 'selectedCarName', 'selectedCarCost', 'selectedCarLife', 'currentyear'];
        let result = await browser.storage.sync.get(keys)
        if (result.yearlyOdometer) yearlyOdometer = result.yearlyOdometer;
        if (result.haggle) haggle = result.haggle;
        if (result.typicalLife) life = result.typicalLife;
        if (result.carPresets) carPresets = result.carPresets;
        if (result.selectedCarName) name = result.selectedCarName;
        if (result.selectedCarCost) cost = result.selectedCarCost;
        if (result.selectedCarLife) life = result.selectedCarLife;
        if (result.currentyear) currentyear = result.currentyear;

        if (result.scrapedData){
            const scraped = result.scrapedData;
            if (scraped.year) year = scraped.year - 2000;
            if (scraped.odometer) odometer = scraped.odometer;
            if (scraped.price) price = scraped.price;
            runCalculation()
        } else if (name){
            drawChart()
        }

            // browser.storage.sync.remove('scrapedData');
        });

    function onCarChange() {
        if (!name) {
            life = 0
            cost = 0
            year = 0
            odometer = 0
            clearSelectedCar()
            resetResult()
            return;
        }
        const lowerCaseName = name.toLowerCase();
        const matchingPreset = carPresets.find(p => p.name.toLowerCase() === lowerCaseName);

        if (matchingPreset) {
            life = matchingPreset.life;
            if (matchingPreset.msrp > 0) {
                cost = matchingPreset.msrp;
            }
            browser.storage.sync.set({ selectedCarName: name, selectedCarCost: cost, selectedCarLife: life });
            browser.storage.sync.remove('scrapedData');
        } else {
            browser.storage.sync.remove(['selectedCarName', 'selectedCarCost', 'selectedCarLife']);
        }
        drawChart()
    }

    function runCalculation() {
        if (year && year > currentyear - 2000){
            resultText = 'Use the last two digits (e.g.: 21 for 2021).<br>Use negative numbers before 2000 (e.g.: -3 for 1997)';
            return
        }
        if (odometer == null && year != null) {
            old = currentyear - 2000 - year
            odometer = old * yearlyOdometer
        } else if (year == null && odometer != null) {
            old = odometer / yearlyOdometer
            year = (currentyear - 2000) - old
        } else if (year && odometer) {
            old = currentyear - 2000 - year
            old = (old + odometer/yearlyOdometer) / 2
        } else return

        var res = cost * 1000 * Math.pow(1 - 2/life, old)

        estimate = Math.round(res)
        beHaggle = Math.round(res/(1-haggle/100))
        AfHaggle = Math.round(res*(1-haggle/100))
        resultText = `${estimate} (${Math.round(res/1000/cost*100)}%) (${beHaggle} before haggling, ${AfHaggle} after)`
            + `<br> ${old.toFixed(1)} y/o (${(old/life*100).toFixed(0)}% of life)`

        drawChart()
    }

    function drawChart(){
        if (myChart) {
            myChart.destroy();
        }
        if (!chartCanvas) return
        let xAxis = Array.from({ length: life+1 }, (_, i) => i)
        let chartOptions: ChartConfiguration = {
            type:"line",
            data:{
                labels: xAxis,
                datasets:[{
                    label: "half under",
                    data:xAxis.map((x: number) => Math.round(cost * 1000 * Math.pow(1 - 2/life, x)* 0.5)),
                    borderColor: "yellow",
                },{
                    label: "after haggle",
                    data:xAxis.map((x: number) => Math.round(cost * 1000 * Math.pow(1 - 2/life, x)*(100-haggle)/100)),
                    borderColor: "green",
                },{
                    label: "fair price",
                    data: xAxis.map((x: number) => Math.round(cost * 1000 * Math.pow(1 - 2/life, x))),
                    borderColor: "cyan",
                },{
                    label: "before haggling",
                    data:xAxis.map((x: number) => Math.round(cost * 1000 * Math.pow(1 - 2/life, x)/(100-haggle)*100)),
                    borderColor: "red",
                },{
                    label: "half over",
                    data:xAxis.map((x: number) => Math.round(cost * 1000 * Math.pow(1 - 2/life, x)* 1.5)),
                    borderColor: "saddlebrown",
                }]
            },
            options:{
                scales:{
                    y: {
                        beginAtZero: true
                    }
                },
                plugins:{
                    tooltip:{
                        callbacks:{
                            label: function(context){
                                let label = context.dataset.label || '';
                                if (label && context.parsed.y) {
                                    label += `: ${context.parsed.y} (${Math.round(context.parsed.y / cost / 10)}%)`;
                                }
                                return label
                            }
                        }
                    },
               
                },
                maintainAspectRatio:false
            }
        }
        if (price) {
            chartOptions.data.datasets.push(
                {
                    type: 'scatter',
                    label: 'Car',
                    data: [{x: Math.round(old), y: price}],
                    backgroundColor: "black"
                }
            )
        }
        myChart = new Chart(chartCanvas, chartOptions)
        chartCanvas.style.height = '30em'
    }

    function clearSelectedCar(){
        name = ''
        browser.storage.sync.remove('scrapedData');
        browser.storage.sync.remove('selectedCarName')
        resetResult()
    }

    function openOptionsPage() {
        browser.runtime.openOptionsPage();
    }

    function kbb(trim: boolean){
        if (year == null) return
        let split = name.split(" ")
        let brand = split[0].toLowerCase()
        let cname = split[1].toLowerCase()
        let kbb = `https://www.kbb.com/${brand}/${cname}/${year+2000}/styles/?intent=buy-used`
        if (trim){
            let trim = split.slice(2).join("-").toLowerCase()
            kbb = `https://www.kbb.com/${brand}/${cname}/${year+2000}/${trim}/?condition=good&intent=buy-used&pricetype=private-party`
        }
        if (odometer != null && odometer > 0) kbb += `&mileage=${odometer*1000}`
        // console.log(kbb)
        window.open(kbb)
    }

    function edmunds(){
        if (year == null) return
        let split = name.split(" ")
        let brand = split[0].toLowerCase()
        let cname = split[1].toLowerCase()
        let edmunds = `https://www.edmunds.com/${brand}/${cname}/${year+2000}/review/`
        window.open(edmunds)
    }
    
    function resetResult(){
        resultText = ""
        if (chartCanvas) {
            chartCanvas.style.height = '0'
            if (myChart) myChart.destroy()
        }
    }
</script>
<main>
    <div class="header">
        <button onclick={()=>window.open("/cars.html", "_blank")} title="Car Presets">🚗</button>
        <button onclick={openOptionsPage} title="Settings">⚙️</button>
    </div>
    <div class="block">
        <div>
            <label style="width: inherit">
                <select style="width: 100%" bind:value={name} onchange={onCarChange}>
                    <option value="">Car Model</option>
                    {#each carPresets as preset}
                        <option value={preset.name}>{preset.name}</option>
                    {/each}
                </select>
            </label>
        </div>
        <div><label><span>OTD price (thou)</span><input type="number" bind:value={cost} oninput={clearSelectedCar} onchange={()=>browser.storage.sync.set({"selectedCarCost":cost})} oncontextmenu={(e)=> {e.preventDefault(); cost = Math.round((cost * 1.05 + 1.5) * 10) / 10; name = ""}}></label></div>
        <div><label><span>Expected Lifespan</span><input type="number" bind:value={life} oninput={clearSelectedCar} onchange={()=>browser.storage.sync.set({"selectedCarLife":life})}></label></div>
    </div>
    <div class="block">
        <!-- svelte-ignore a11y_autofocus -->
        <div><label><span>Model Year</span><input type="number" autofocus bind:value={year} oninput={resetResult} oncontextmenu={(e)=> {e.preventDefault(); year = currentyear - 2000}}></label></div>
        <div><label><span>Odometer (thou)</span><input type="number" bind:value={odometer} oninput={resetResult}></label></div>
    </div>
    {#if (year || odometer)}
        {@const spLen = name.split(" ").length}
        <div class="mb-1">
            <button onclick={runCalculation}>Calculate</button>
            {#if spLen > 1}
                <button onclick={()=>kbb(false)}>KBB</button>
                {#if spLen > 2}
                    <button onclick={()=>kbb(true)}>+Trim</button>
                {/if}
                <button onclick={edmunds}>Edmunds</button>
            {/if}
        </div>
        <div id="result" style:color={old > life ? "red" : old > life/2 ? "orange": ""}>
            {@html resultText}
        </div>
    {/if}
    <div class="mb-1">
        <button onclick={async ()=> {
            let res = await browser.runtime.sendMessage("get-car-data-single")
            if (res){
                year = res.year - 2000
                odometer = res.odometer
                resetResult()
                runCalculation()
            }
        }}>Single Car</button>
        <button onclick={()=> {
            year = null
            odometer = null
            resetResult()
            browser.runtime.sendMessage("get-car-data-multiple")
        }}>Multiple Cars</button>
        <button onclick={()=>browser.runtime.sendMessage("sort-cars")}>Sort</button>
    </div>
    {#if !(year || odometer)}
        <div>
            <span>Please fill the fields to calculate or use the quick actions</span>
        </div>
    {/if}
    <div><canvas bind:this={chartCanvas} style="height:0; width: 10em;" id="mc"></canvas></div>
</main>


<style>
    main {
        padding: 1em;
    }
    .header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1em;
        gap: 0.5em;
    }
    .header button {
        flex-grow: 1;
        text-align: center;
        text-decoration: none;
        padding: 1px 6px;
        border-width: 2px;
        border-style: outset;
        border-color: buttonface;
        border-image: initial;
    }
    div.block{
        /* width: 30em; */
        border: 1px red solid;
        margin-bottom: 1em;
    }
    label{
        display: flex;
        justify-content: space-between;
        margin: 1em;
        width: 20em;
    }
    label > span {
        text-wrap-mode: nowrap;
    }
    input{
        width: 5em;
        margin-left: 2em;
    }
    .mb-1{
        margin-bottom: 0.5em;
    }
</style>
