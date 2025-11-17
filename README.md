Open Source Calculator to estimate the cost of used cars using double-declining balance (DDB) depreciation. Modifies supported pages to encode price with suggestions, and orders listings in decreasing order of discount from fair price. Can link to other websites: KBB, edmunds, NICB

Price is calculated as $$\text{Price} = (1 - 2/\text{life})^\text{years} \cdot \text{new-OTD-price}$$

where $$\text{years} = (\text{age of model} + (\text{odometer} / \text{yearlyOdometer})) / 2$$


There is no backend and no telemetry. Not affiliated with any website or service, preloaded in the app or otherwise.

# How to install from source:

run `npm install` then `npm run build` in root directory, then temporarily load manifest.json from build/firefox

# Acknowledgements / Dependencies:

Sveltekit extension adapter: https://github.com/michmich112/sveltekit-adapter-chrome-extension

chartjs: https://github.com/chartjs/Chart.js

<a href="https://www.flaticon.com/free-icons/car-wash" title="car wash icons">Car wash icons created by surang - Flaticon</a>