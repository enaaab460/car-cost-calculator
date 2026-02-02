<script lang="ts">
    import { Chart } from "chart.js/auto"
    import type { ChartConfiguration } from "chart.js/auto"
	import { onMount } from "svelte";
    import type { CarPreset } from "$lib";
    import { goto } from "$app/navigation";

    interface CarPoint {
        age: number;
        price: number;
        name: string;
        link: string;
    }

    interface Point {
        x: number;
        y: number
    }

    let carPresets = $state<CarPreset[]>([]);
    let yearlyOdometer = $state(0)
    let haggle = $state(0)
    let currentyear = $state(0)

    let cost = $state(0)
    let typicalLife = $state(0)
    let old = $state(0)
    let year: null | number = $state(null)
    let odometer: null | number = $state(null)
    let price: null | number  = $state(null)
    let name = $state("")
    let fairPrice = $state(0)
    let beHaggle = $state(0)
    let afHaggle = $state(0)

    let depreciationChart: Chart | null = $state(null);
    let depreciationCanvas = $state<HTMLCanvasElement>()
    let resultElement = $state<HTMLElement>()
    let resultText = $state("")

    onMount(() => {
        var result = localStorage.getItem('settings')
        if (!result) {
            alert("Settings not initialised, redirecting to options.html")
            goto("options.html")
            return
        }
        ({yearlyOdometer, haggle, typicalLife, currentyear} = JSON.parse(result))
        result = localStorage.getItem('carPresets')
        if (result) carPresets = JSON.parse(result)
        else carPresets = []

        result = localStorage.getItem('selectedCar')
        if (result){
            ({name, cost, typicalLife} = JSON.parse(result))
        }
        result = localStorage.getItem('scrapedSingle')
        if (result){
            var r = JSON.parse(result)
            if (r){
                if (r.year) year = r.year - 2000
                if (r.odometer) odometer = r.odometer / 1000
                if (r.price) price = r.price / 1000
                runCalculation()
            }
        } else if (cost && typicalLife){
            drawDepreciationChart()
        }
    })

    function clearSelectedCar(){
        name = ''
        onCarChange()
    }

    function onCarChange() {
        localStorage.removeItem('selectedCar')
        localStorage.removeItem('scrapedSingle')
        resetResult()
        // drawDepreciationChart()
        if (!name) return;
        const lowerCaseName = name.toLowerCase();
        const matchingPreset = carPresets.find(p => p.name.toLowerCase() === lowerCaseName);
        if (matchingPreset) {
            typicalLife = matchingPreset.life;
            if (matchingPreset.msrp > 0) {
                cost = matchingPreset.msrp;
            }
            localStorage.setItem("selectedCar", JSON.stringify({name, cost, typicalLife}))
        } else {
            localStorage.removeItem('selectedCar')
        }
    }

    function runCalculation() {
        if (year && year > currentyear - 2000){
            resultText = 'Use the last two digits (e.g.: 21 for 2021).<br>Use negative numbers before 2000 (e.g.: -3 for 1997)';
            return
        }
        if (odometer && odometer <= 0) {
            resultText = "Odometer can't be less than or equal to 0"
            return
        }
        if (price && price <= 0) {
            resultText = "Price can't be less than or equal to 0"
            return
        }
        if (cost <= 0) {
            resultText = "Cost can't be less than or equal to 0"
            return
        }
        if (typicalLife <= 0) {
            resultText = "Life can't be less than or equal to 0"
            return
        }
        if (odometer == null && year != null) {
            old = currentyear - 2000 - year
            odometer = old * yearlyOdometer
        } else if (year == null && odometer != null) {
            old = odometer / yearlyOdometer
            year = (currentyear - 2000) - old
        } else if (year != null && odometer != null) {
            old = currentyear - 2000 - year
            old = (old + odometer/yearlyOdometer) / 2
        } else return

        let res = cost * 1000 * Math.pow(1 - 2/typicalLife, old)
        fairPrice = res
        beHaggle = Math.round(res/(1-haggle/100))
        afHaggle = Math.round(res*(1-haggle/100))
        resultText = `${res.toFixed(0)} (${Math.round(res/1000/cost*100)}% of new)`
            + `<br> ${old.toFixed(1)} y/o (${(old/typicalLife*100).toFixed(0)}% of life)`
        
        if (price && price > 0) resultText = `${price*1000 > res ? '+' : ''}${(price*1000 - res).toFixed(0)}`
        + `<br>${price*1000 > res ? '+' : ''}${((price*1000-res)/res*100).toFixed(0)}% (${(price/cost*100).toFixed(0)}% of new)`
        + `<br>${resultText}`

        drawDepreciationChart()

        var scrapedSingle: any = {year: year + 2000, odometer: odometer * 1000}
        if (price) scrapedSingle.price = price * 1000
        chrome.storage.sync.set({"scrapedSingle": scrapedSingle})
    }

    function drawDepreciationChart(){
        if (depreciationChart) {
            depreciationChart.destroy();
        }
        if (!depreciationCanvas || !cost || !typicalLife) return
        let xAxis = Array.from({ length: typicalLife+1 }, (_, i) => i)
        let chartOptions: ChartConfiguration = {
            type:"line",
            data:{
                labels: xAxis,
                datasets:[{
                    label: "half under",
                    data:xAxis.map((x: number) => Math.round(cost * 1000 * Math.pow(1 - 2/typicalLife, x)* 0.5)),
                    borderColor: "yellow",
                },{
                    label: "after haggle",
                    data:xAxis.map((x: number) => Math.round(cost * 1000 * Math.pow(1 - 2/typicalLife, x)*(100-haggle)/100)),
                    borderColor: "green",
                },{
                    label: "fair price",
                    data: xAxis.map((x: number) => Math.round(cost * 1000 * Math.pow(1 - 2/typicalLife, x))),
                    borderColor: "cyan",
                },{
                    label: "before haggling",
                    data:xAxis.map((x: number) => Math.round(cost * 1000 * Math.pow(1 - 2/typicalLife, x)/(100-haggle)*100)),
                    borderColor: "red",
                },{
                    label: "half over",
                    data:xAxis.map((x: number) => Math.round(cost * 1000 * Math.pow(1 - 2/typicalLife, x)* 1.5)),
                    borderColor: "saddlebrown",
                }]
            },
            options:{
                scales:{
                    y: {
                        title: { display: true, text: 'Price' },
                        beginAtZero: true,
                    },
                    x: {
                        title: { display: true, text: 'Age (years)' },
                        type: "linear",
                        max: typicalLife
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
                    data: [{x: old, y: price * 1000}],
                    backgroundColor: "black",
                    pointRadius: 5,
                }
            )
        } 
        depreciationChart = new Chart(depreciationCanvas, chartOptions)
        depreciationCanvas.style.height = '30em'
    }

    function kbb(trim: boolean){
        if (year == null) return
        let split = name.split(" ")
        let brand = split[0].toLowerCase()
        let cname = split[1].toLowerCase()
        let kbb = `https://www.kbb.com/${brand}/${cname}/${year+2000}/styles/?intent=buy-used`
        if (split.length > 2 && trim){
            let trim = split.slice(2).join("-").toLowerCase()
            kbb = `https://www.kbb.com/${brand}/${cname}/${year+2000}/${trim}/?condition=good&intent=buy-used&pricetype=private-party`
        }
        if (odometer != null && odometer > 0) kbb += `&mileage=${odometer*1000}`
        // console.log(kbb)
        window.open(kbb)
    }

    function edmunds(yearSearch: boolean){
        if (year == null) return
        let split = name.split(" ")
        let brand = split[0].toLowerCase()
        let cname = split[1].toLowerCase()
        var edmunds = ""
        if (!yearSearch) edmunds = `https://www.edmunds.com/${brand}/${cname}/review/`
        else edmunds = `https://www.edmunds.com/${brand}/${cname}/${year+2000}/review/`
        window.open(edmunds)
    }
    
    async function resetResult(){
        resultText = ""
        if (depreciationCanvas) {
            depreciationCanvas.style.height = '0'
            if (depreciationChart) depreciationChart.destroy()
        }
    }
</script>
<main>
    <div class="header">
        <button onclick={()=>goto("/cars.html")} title="Car Presets">🚗</button>
        <button onclick={()=>goto("/options.html")} title="Settings">⚙️</button>
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
        <div><label><span>OTD price (thou)</span><input type="number" bind:value={cost} oninput={clearSelectedCar} onchange={()=>chrome.storage.sync.set({"selectedCarCost":cost})}></label></div>
        <div><label title={`${typicalLife*yearlyOdometer}k`}><span>Expected Lifespan</span><input type="number" maxlength=2 bind:value={typicalLife} oninput={clearSelectedCar} onchange={()=>chrome.storage.sync.set({"selectedCarLife":typicalLife})}></label></div>
    </div>
    <div class="block">
        <!-- svelte-ignore a11y_autofocus -->
        <div><label title={year ? String(currentyear - year - 2000) + "y" : ""}><span>Model Year</span><input type="number" autofocus maxlength=2 bind:value={year} oninput={resetResult} oncontextmenu={(e)=> {e.preventDefault(); year = currentyear - 2000}}></label></div>
        <div><label title={odometer ? (odometer/yearlyOdometer).toFixed(1) + "y" : ""}><span>Odometer (thou)</span><input type="number" bind:value={odometer} oninput={resetResult}></label></div>
        <div><label><span>Price (thou)</span><input type="number" bind:value={price} oninput={resetResult}></label></div>
    </div>
    <div class="mb-1">
        {#if (year != null || odometer != null)}
            <button onclick={runCalculation}>Calculate</button>
        {:else if (cost && typicalLife && !depreciationChart?.canvas)}
            <button onclick={drawDepreciationChart}>Draw Depreciation</button>
        {:else}
            <span>Please fill the fields to calculate or use the quick actions</span>
        {/if}
        {#if name.split(" ").length > 1}
            <button onclick={()=>kbb(false)} oncontextmenu={(e)=>{e.preventDefault();kbb(true)}}>KBB</button>
            <button onclick={()=>edmunds(false)} oncontextmenu={(e)=>{e.preventDefault();edmunds(true)}}>Edmunds</button>
        {/if}
        {#if resultText}
            <div bind:this={resultElement} 
                style:color={
                    (price) ? (
                        (price*1000 <= fairPrice * 1 / 2) ? "yellow" : 
                        (price*1000 <= afHaggle) ? "green" :
                        (price*1000 <= fairPrice) ? "cyan" :
                        (price*1000 <= beHaggle) ? "purple" :
                        (price*1000 <= fairPrice * 3 / 2) ? "red" :
                        "saddlebrown"
                    ) : "black"
                }
                style:background={(price && (price*1000 <= fairPrice * 1 / 2))? "gray" : ""}
                style:text-decoration = { (old > typicalLife) ? "line-through" : (old / typicalLife > 2/4) ? "underline" : ""};
                style:font-style = {(old / typicalLife < 1 / 4) ? "italic" : ""}
                style:padding ="0.5em" class="mb-1" 
            >
                {@html resultText}
            </div>
        {/if}
    </div>
    <div><canvas bind:this={depreciationCanvas} style="height:0;"></canvas></div>
</main>


<style>
    main {
        padding: 1em;
        width: 22em;
        margin: auto;
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
    main > *{
        margin-bottom: 0.5em;
    }
</style>
