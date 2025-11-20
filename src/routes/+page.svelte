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

    let depreciationChart: Chart | null = null;
    let depreciationCanvas = $state<HTMLCanvasElement>()
    let regressionChart: Chart | null = null;
    let regressionCanvas = $state<HTMLCanvasElement>()
    let resultText = $state("")
    let regressionDataUrl = $state<string | null>(null)
    let scrapedMultiple = $state<CarPoint[]>([])

    onMount(async () => {
        const keys = ['yearlyOdometer', 'haggle', 'typicalLife', 'carPresets', 'scrapedSingle', 'scrapedMultiple', 'yearSelector', 'odometerSelector', 'modelSelector', 'selectedCarName', 'selectedCarCost', 'selectedCarLife', 'currentyear'];
        let result = await chrome.storage.sync.get(keys)
        if (result.yearlyOdometer) yearlyOdometer = result.yearlyOdometer;
        else openOptionsPage()
        if (result.haggle) haggle = result.haggle;
        if (result.typicalLife) life = result.typicalLife;
        if (result.carPresets) carPresets = result.carPresets;
        if (result.selectedCarName) name = result.selectedCarName;
        if (result.selectedCarCost) cost = result.selectedCarCost;
        if (result.selectedCarLife) life = result.selectedCarLife;
        if (result.currentyear) currentyear = result.currentyear;

        if (result.scrapedSingle){
            const scraped = result.scrapedSingle;
            if (scraped.year) year = scraped.year - 2000;
            if (scraped.odometer) odometer = scraped.odometer;
            if (scraped.price) price = scraped.price;
            runCalculation()
        } else if (name){
            drawDepreciationChart()
        }

        result = await chrome.storage.local.get(['scrapedMultiple','scrapedMultipleNew'])
        if (result.scrapedMultipleNew) {
            drawRegressionChart(result.scrapedMultipleNew)
            await chrome.storage.local.remove("scrapedMultiple")
        } else if (result.scrapedMultiple){
            year = null
            odometer = null
            scrapedMultiple = result.scrapedMultiple
            drawRegressionChart(result.scrapedMultiple)
        } 

            // chrome.storage.sync.remove('scrapedSingle');
        });

    function onCarChange() {
        if (!name) {
            life = 0
            cost = 0
            year = 0
            odometer = 0
            clearSelectedCar()
            return;
        }
        resetResult()
        const lowerCaseName = name.toLowerCase();
        const matchingPreset = carPresets.find(p => p.name.toLowerCase() === lowerCaseName);

        if (matchingPreset) {
            life = matchingPreset.life;
            if (matchingPreset.msrp > 0) {
                cost = matchingPreset.msrp;
            }
            chrome.storage.sync.set({ selectedCarName: name, selectedCarCost: cost, selectedCarLife: life });
            chrome.storage.sync.remove('scrapedSingle');
        } else {
            chrome.storage.sync.remove(['selectedCarName', 'selectedCarCost', 'selectedCarLife']);
        }
        drawDepreciationChart()
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

        drawDepreciationChart()
    }

    function drawDepreciationChart(){
        if (depreciationChart) {
            depreciationChart.destroy();
        }
        if (!depreciationCanvas) return
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
                        beginAtZero: true,
                    },
                    x: {
                        type: "linear",
                        max: life
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
                    data: [{x: old, y: price}],
                    backgroundColor: "black",
                    pointRadius: 5,
                }
            )
        }
        depreciationChart = new Chart(depreciationCanvas, chartOptions)
        depreciationCanvas.style.height = '30em'
    }

    function calculateRegressionLine(data: Point[]) {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        data.forEach(point => {
            sumX += point.x;
            sumY += point.y;
            sumXY += point.x * point.y;
            sumX2 += point.x * point.x;
        });

        const meanX = sumX / n;
        const meanY = sumY / n;

        // Calculate Slope (m)
        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = (n * sumX2) - (sumX * sumX);
        const m = numerator / denominator; // Slope (Central Gradient)

        // Calculate Y-intercept (b)
        const b = meanY - (m * meanX);

        // Get the min and max X values to define the line's start and end points
        const minX = Math.min(...data.map(p => p.x));
        const maxX = Math.max(...data.map(p => p.x));

        // Create the two points for the trendline dataset: (minX, y=mx+b) and (maxX, y=mx+b)
        const trendlineData = [
            { x: minX, y: m * minX + b },
            { x: maxX, y: m * maxX + b }
        ];

        return { m, b, trendlineData };
    }

    function drawRegressionChart(data: CarPoint[]){
        if (regressionChart) {
            regressionChart.destroy();
        }
        if (!regressionCanvas) return

        let scatterData = data.map((x: CarPoint) => ({ x: x.age, y: x.price }))

        const csvHeader =  [...Object.getOwnPropertyNames(data[0])].join(',') + '\n';
        const csvRows = data.map(d => 
            [...Object.values(d)].join(',')
        ).join('\n');
        const csvData = csvHeader + csvRows;
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        if (regressionDataUrl) {
            URL.revokeObjectURL(regressionDataUrl);
        }
        regressionDataUrl = URL.createObjectURL(blob);
        const regression = calculateRegressionLine(scatterData);
        const { m, b, trendlineData } = regression;
        
        var optTrendline = [{x: 0, y: cost * 1000},{x: life, y: cost * 1000 * Math.pow(1 - 2/life, life)}]
        let xAxis = Array.from({ length: life+1 }, (_, i) => i)
        let correct = xAxis.map(x => ({x: x, y: cost * 1000 * Math.pow(1 - 2/life, x)}))
        const { m: om, b: ob, trendlineData: otl } = calculateRegressionLine(correct)
        const config = {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: `Data Points (${scatterData.length})`,
                        data: scatterData,
                        backgroundColor: 'black',
                        pointRadius: 2,
                    },
                    {
                        label: `Regression Line (y = (${m.toFixed(0)} * age) + ${b.toFixed(0)})`,
                        data: trendlineData,
                        type: 'line', 
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 3,
                        pointRadius: 0, 
                    },
                    {
                        label: `Fair Slope (y = (${om.toFixed(0)} * age) + ${ob.toFixed(0)})`,
                        data: otl,
                        type: 'line', 
                        borderColor: 'cyan',
                        borderWidth: 3,
                        pointRadius: 0, 
                    }
                ]
            },
            options: {
                // responsive: true,
                scales: {
                    x: {
                        title: { display: true, text: 'Age (years)' },
                        type: 'linear',
                        position: 'bottom',
                        max: life
                    },
                    y: {
                        title: { display: true, text: 'Price' },
                        type: 'linear',
                        beginAtZero: true
                    }
                },
                maintainAspectRatio: false
            }
        } as ChartConfiguration;
        regressionChart = new Chart(regressionCanvas, config)
        regressionCanvas.style.height = '30em'
    }

    function clearSelectedCar(){
        name = ''
        chrome.storage.local.remove('scrapedSingle');
        chrome.storage.local.remove('scrapedMultiple');
        chrome.storage.sync.remove('selectedCarName')
        resetResult()
    }

    function openOptionsPage() {
        chrome.runtime.openOptionsPage();
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
        if (depreciationCanvas) {
            depreciationCanvas.style.height = '0'
            if (depreciationChart) depreciationChart.destroy()
        }
        if (regressionCanvas) {
            regressionCanvas.style.height = '0'
            if (regressionChart) regressionChart.destroy()
        }
        if (regressionDataUrl) {
            URL.revokeObjectURL(regressionDataUrl);
            regressionDataUrl = null;
        }
    }

    async function scrapeMultiple(append: boolean){
        year = null
        odometer = null
        // resetResult()
        let res:CarPoint[] = await chrome.runtime.sendMessage("get-car-data-multiple")
        if (res){
            if (append){
                await chrome.storage.local.remove("scrapedMultipleNew")
                // console.log("after scrap")
                // console.log(scrapedMultiple)
                // console.log(res)
                res = $state.snapshot([...scrapedMultiple, ...res])
                // scrapedMultiple = res
            }

            res = Array.from(new Map(res.map(item => [item.link, item])).values());
            // console.log("outside append", res)
            drawRegressionChart(res)
            await chrome.storage.local.set({"scrapedMultiple": res})
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
        <div><label><span>OTD price (thou)</span><input type="number" bind:value={cost} oninput={clearSelectedCar} onchange={()=>chrome.storage.sync.set({"selectedCarCost":cost})} oncontextmenu={(e)=> {e.preventDefault(); cost = Math.round((cost * 1.05 + 1.5) * 10) / 10; name = ""}}></label></div>
        <div><label><span>Expected Lifespan</span><input type="number" bind:value={life} oninput={clearSelectedCar} onchange={()=>chrome.storage.sync.set({"selectedCarLife":life})}></label></div>
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
            let res = await chrome.runtime.sendMessage("get-car-data-single")
            if (res){
                year = res.year - 2000
                odometer = res.odometer
                price = res.price
                resetResult()
                runCalculation()
            }
        }}>Single Car</button>
        <button onclick={async () => await scrapeMultiple(false)}
        oncontextmenu={async (e)=> {e.preventDefault(); await scrapeMultiple(true)}}>Multiple Cars</button>
        <button onclick={()=>chrome.runtime.sendMessage("sort-cars")}>Sort</button>
    </div>
    {#if !(year || odometer)}
        <div>
            <span>Please fill the fields to calculate or use the quick actions</span>
        </div>
    {/if}
    <div><canvas bind:this={depreciationCanvas} style="height:0; width: 10em;"></canvas></div>
    <div><canvas bind:this={regressionCanvas} style="height:0; width: 10em;"></canvas></div>
    {#if regressionDataUrl && name}
        <a href={regressionDataUrl} download={`${name}_data_${Math.floor(Date.now() / 1000)}.csv`}>Download Data</a>
    {/if}
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
