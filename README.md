# Intro

Calculator to estimate the cost of used cars using double-declining balance (DDB) depreciation. Modifies supported pages to encode price with suggestions, and orders listings in decreasing order of discount from fair price. Can link to other websites: KBB, edmunds, NICB

There is no backend and no telemetry. Firefox might sync extension data if logged in, for ease of use and persistence of data across devices (computers and Android devices). Not affiliated with any website or service, preloaded in the app or otherwise.

Price is calculated as $$\text{Price} = (1 - 2/\text{life})^\text{years} \cdot \text{new-OTD-price}$$

where $$\text{years} = (\text{age of model} + (\text{odometer} / \text{yearlyOdometer})) / 2$$

where the car is very commonly available (not exotic, 10k+ listings on visor.vin for example), and its price throughout the years matches inflation.

where life is assumed to be between 10 and 20 years, at 13.5k miles a year (can be changed in the settings). Less reliable cars are closer to 10 years and more reliable are closer to 20 years. Life is not simply the expected lifespan of the drivetrain. A running car can be also be totaled if it needs expensive repairs (relative to the remaining value of the car) or if parts are no longer available. Rust rots and condition of interior and exterior degrades with time regardless of miles.

## Quick notes 

For the time being, the extension will not be on chrome extension storeplace, as creating a developer account requires a fee (the nerve of those guys), and my bank doesn't play nice with Google.

Extension made with miles and american websites in mind, but kilometers and other websites might still work.

Extension comes preloaded with some US websites, with the option to support more website using css selectors.You can add car presets for name, price, and expected lifespan. If name matches kbb's or edmunds' naming, you can search them much quicker. The calculator and graphs do not need car presets or website presets, but they greatly improve the experience. 

Suggested fair price is merely a mathematical approximation, with no consideration for market factors. 

Double-declining rate allowed mirroring common depreciation rates (after the usual 10% incentives are factored in): ~15% in the first year and ~55% in the first 5 years, in a car that lasts 15 years before being junked. 

## Explanation of price style

* yellow = >50% below fair price -> just downpayment / need extensive repairs / branded title / project car

* green = below haggled percent (15% by default) from fair price -> many have branded title (in my experience) but some might not (best option if mechanically sound)

* cyan = below fair price but not green -> some might be branded but many won't (sweet spot)

* purple = above fair price but not red (sweet spot)
red = haggling (15% by default) won't reach below the fair price

* brown = >50% over fair price

* italic = first quarter of life, depreciation faster than age

* bland = second quarter of life, depreciation slightly slower than age (sweet spot)

* underlined = second half of life, very slow depreciation, running but might need major repairs depending on model and use.

* crossed-out = exceeded its expected life, each day is a gift, wheels might fall off tomorrow.

15% default haggle is almost too much, but it increases the range of cyan and purple. It can be changed in the settings. Not reaching the fair price does not necessarily mean a bad deal. It is all relative to your car market. KBB can be used to verify the fair price for a particular model, trim, year, and mileage, but many think that KBB prices are too optimistic (at the time of writing this). 

Hovering over the price in either mode will show a brief summary of the car discount, fair price, and calculated age

## Single Mode (Alt-Q)
Allows plotting where the car stands relative to the depreciation curve, and price styles. If the css selectors of the website are registered, it will automatically parse it for the year, miles and price. It can be still be used standalone without registering the website. If the name of the car is the same as KBB, then using the KBB button will allow quick access to kbb price estimator. If the trim is also the same, the '+trim' will provide 1-click shortcut. Edmunds support is also available but is mainly useful for specs, recalls, and suggested OTD price. Not affiliated with either.

The mode can read the listing's page for red flags, and color them red and scroll them into view. If it detects a 17 character string of letters and numbers, it will assume it is the VIN and provide shortcut to check it using the service chosen in the settings.

## Multiple mode (Alt-W)
Should be used for the same car model, and if possible, include only the trims acceptable. Sorting then allows to ordering which listings should be looked at first. Even if the estimated price is wrong, the discounted amount relative to the age of the car would still be the same (if trims are accounted for before). If might be frustrating, since the most discounted cars are also the most likely to have a problem warranting a discount. Unfavorable listings can be blacklisted from the context menu (right click menu).

## Out-the-door price tangent
MSRP + non-negotiable fees (gorvernmental or dealer, like destination fees) - incentives.
Most cars can have >10% incentives, which is the main reason cars are said to lose 10% the moment they are driven off the lot (as new). Brands that do not offer such incentives (namely Toyota) don't have this "issue", which is part of the reason they hold their value more. Other brands have inflate MSRP then offer incentives. Electric cars are also said to lose a lot of their value even if that inflated price was usually not paid, since they offer(ed) significant incentives. Edmunds and KBB can be used as a reference for OTD price in the USA.

## Toyota Tangent
Even if many toyotas regularly exceed 250k miles, this should not taken for granted. In the iseecars article below, most of their models reach 250k miles less than 20% of the time. Since they sell millions of cars, 20% of that is still millions, but many more won't reach that number. Some models and years had engine problems and needed recalls, like all manufacturers. They are the most reliable for sure, but not bullet-proof, and not barely broken in at 100k miles. Especially if you don't know how it was taken care of. Even if the drivetrain is alright, because the rest of the car might not, the car can be totaled regardless. It is fair to estimate the lifespan of their good models (not the GR86/BRZ, oil burning 2010 camry,...) to be 20 years, what I have found that many facebook marketplace judge corolla's depreciation as if they last 30+ years. That said, many others still follow the curve of 20 year lifespan. Tacomas are as good as bullet-proof though, according to the same article. But I hear the new tundras have problems though.

## Depreciation Tangent
If most cars are way above the depreciation curve, this could mean that the lifespan estimated is smaller than what the market agreed upon. The lifespan might have been too conservative (eg, 10 years for a corolla), or because they believe that these cars hold their value (age like wine). If a car has lots of miles and is regularly only slightly cheaper than new, maybe buying it new makes more sense. It will be in better shape, you will have warranty (and peace of mind), you will know its maintanence exactly, and will have better finance rates.

Covid cars were sold over MSRP, and were in short supply, that they inherently costed more. So they are expected to be overpriced. But they make little sense now that the market is correcting and they cost close to new.

Covid costed the market 10 million cars that weren't produced, and now that the average new car costs 50k, more people are heading towards used cars.* So greater demand and smaller supply pushed the prices upward. and inflation since covid is 25% according to CPI.

Exotic cars also don't typically follow the depreciation curve. They might not be the first option for those who value peace of mind because they might also be the most abused (red-lined, burnouts, aftermarket modifications, track days) or not generally reliable.

### Sources:

\* Heard multiple times on Youtube but can't find source now

https://autorecyclingworld.com/what-is-the-lifespan-of-a-vehicle-in-the-usa/

https://www.iseecars.com/longest-lasting-cars-study

https://www.caranddriver.com/auto-loans/a32880477/average-mileage-per-year/

https://www.youtube.com/watch?v=p2Lj5hJU5Ns&pp=ygUSaG93IGxvbmcgY2FycyBsYXN0

https://www.kbb.com/car-depreciation/

# Disclaimer (might be superfluous)

Since the extension reads the current tab to skim its data for both single and multiple, it is inherently risky to use on a browser where sensitive data is accesssed (eg, banking, sensitive work, ...). If you are already comfortable with ad-blockers and screen-readers, or use any major social network on the same browser, this disclaimer is meaningless. No data is sent back to any back-end related to me. I have used the minimum number of dependancies I can, and yet I can not vouch for them personally. I can only vouch for what I wrote.

AI was used in writing this extension. All code was revised and tested (to the best of my ability).

This is the first browser extension I wrote.

# How to install:

## from firefox extensions marketplace:


## from source:
run `npm install` then `npm run build` in root directory, then temporarily load manifest.json from `build/firefox`

# Acknowledgements / Dependencies:

Sveltekit: https://github.com/sveltejs/kit

Sveltekit extension adapter: https://github.com/michmich112/sveltekit-adapter-chrome-extension

chartjs: https://github.com/chartjs/Chart.js

<a href="https://www.flaticon.com/free-icons/car-wash" title="car wash icons">Car wash icons created by surang - Flaticon</a>