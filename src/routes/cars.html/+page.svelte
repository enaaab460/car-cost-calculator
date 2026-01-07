<script lang="ts">
	import { onMount } from "svelte";
    import type {CarPreset} from "$lib"

    let carPresets = $state<CarPreset[]>([]);
    let statusText = $state('');
    let typicalLife = $state(0)

    onMount(() => {
        // Load saved presets when the component mounts
        var result = localStorage.getItem('carPresets')
        if (result){
            carPresets = JSON.parse(result)
        }
        result = localStorage.getItem("settings")
        if (result){
            let r = JSON.parse(result)
            typicalLife = r.typicalLife
        }
        document.onkeydown = (e) => {
            if (e.key == "s" && e.ctrlKey){
                e.preventDefault()
                savePresets()
            }
        }
    });

    function savePresets() {
        carPresets.sort((a, b) => a.name.localeCompare(b.name));
        carPresets = carPresets.filter(p => p.name.trim() !== ''),
        localStorage.setItem("carPresets", JSON.stringify($state.snapshot(carPresets)))
        statusText = 'Car presets saved.';
        setTimeout(() => { statusText = ''; }, 1500);
        localStorage.removeItem("selectedCar")
    }

    function addCar() {
        carPresets.push({
            id: Date.now(), // Simple unique ID
            name: '',
            msrp: 0,
            life: typicalLife, // Default life
        });
    }

    function removeCar(id: number) {
        carPresets = carPresets.filter(p => p.id !== id);
    }
</script>

<main>
    <a href="/" class="back-button">← Back to Calculator</a>
    <h1>Car Model Presets</h1>
    <p title="eg, Toyota Corolla-Cross LE">Set the Car name in the first box (BRAND MODEL TRIM?) (brand and model names should be hyphenated if multi-part, trim is optional & does not need hypen)</p>
    <p>Set the OTD price (including destination fees, taxes) in thousands in the second box</p>
    <p>Set the expected lifespan in years in the third box</p>

    {#each carPresets as preset (preset.id)}
        <div class="car-preset">
            <input type="text" placeholder="Model Name" bind:value={preset.name} />
            <input type="number" placeholder="OTD Price (thou)" bind:value={preset.msrp}/>
            <input type="number" placeholder="Lifespan (years)" bind:value={preset.life} />
            <button class="remove-btn" onclick={() => removeCar(preset.id)}>Remove</button>
        </div>
    {/each}

    <button onclick={addCar}>Add New Car Model</button>

    <hr />

    <button onclick={savePresets}>Save Presets</button>
    <div id="status">{statusText}</div>
</main>

<style>
    main { 
        padding: 1em;
        width: fit-content;
    }
    .car-preset {
        /* display: grid; */
        grid-template-columns: 2fr 1fr 1fr auto;
        gap: 0.5em;
        margin-bottom: 0.5em;
        align-items: start; /* Align items to the top so labels don't center */
    }
    .remove-btn {
        background-color: #f44336;
        align-self: end; /* Align remove button to the bottom of its grid cell */
        color: white;
        border: none;
        padding: 8px 12px;
        cursor: pointer;
    }
    hr { margin: 1.5em 0; }
    #status { margin-top: 1em; color: green; }
</style>