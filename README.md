Calculator to estimate the cost of used cars using double-declining balance (DDB) depreciation. Modifies supported pages to encode price with suggestions, and orders listings in decreasing order of discount from fair price. Can link to other websites: KBB, edmunds, NICB

There is no backend and no telemetry. Not affiliated with any website or service, preloaded in the app or otherwise.

Price is calculated as $$\text{Price} = (1 - 2/\text{life})^\text{years} \cdot \text{new-OTD-price}$$

where $$\text{years} = (\text{age of model} + (\text{odometer} / \text{yearlyOdometer})) / 2$$

where the car is very commonly available (not exotic, 10k+ listings on visor.vin for example), and its price throughout the years matches inflation.

where life is assumed to be between 10 and 20 years, at 13.5k miles a year. Life is not simply the expected lifespan of the drivetrain. A running car can be also be totaled if it needs expensive repairs (relative to the remaining value of the car) or if parts are no longer available. Rust and condition of interior degrade with time regardless of miles.

## Out-the-door price tangent
MSRP + destination charges + taxes,titles,registration + non-negotiable dealer fees - incentives.
Most cars can have >10% incentives, which is the main reason cars are said to lose 10% the moment they are driven off the lot (as new). Brands that do not offer such incentives (namely Toyota), don't have this "issue", which is part of the reason they hold their value more. Other brands have inflate MSRP then offer incentives. Electric cars are also said to lose a lot of their value even if that inflated price was usually not paid. Edmunds and KBB can be used as a reference for OTD price in the USA.

## Toyota Tangent
Even if many toyotas regularly exceed 250k miles, this should not taken for granted. In the iseecars article below, most of their models reach 250k miles less than 20% of the time. Since they sell millions of cars, 20% of that is still millions, but many more won't reach that number. Even if the drivetrain is alright, because the rest of the car might not, the car can be totaled regardless.

## Depreciation Tangent
If most cars are way above the depreciation curve, this could mean that the lifespan estimated is smaller than what the market agreed upon. The lifespan might have been too conservative (eg, 10 years for a corolla), or because they believe that these cars hold their value (age like wine). If a car has lots of miles and is regularly only slightly discounted, maybe buying it new makes more sense. It will be in better shape, you will have warranty (and peace of mind), you will know its maintanence exactly, and will have better finance rates.
Covid cars were sold over MSRP, and were in short supply, that they inherently costed more. So they are expected to be overpriced. But they make little sense now that the market is correcting and they cost close to new.
Covid costed the market 10 million cars that weren't produced, and now that the average new car costs 50k, more people are heading towards used cars. So greater demand and smaller supply pushed the prices upward. and inflation since covid is 25% according to CPI.
Exotic cars also don't typically follow the depreciation curve. They might not be the first option for those who value peace of mind because they might also be the most abused (red-lined, burnouts, aftermarket modifications, track days) or not generally reliable.

## Explanation of price style
yellow = >50% below fair price -> just downpayment / need extensive repairs / branded title / project car
green = below haggled percent (15% by default) from fair price -> many have branded title (in my experience) but some might not
cyan = below fair price but not green -> some might be branded
purple = above fair price but not red
red = haggling (15% by default) won't reach below the fair price
brown = >50% over fair price

italic = first quarter of life, depreciation faster than age
bland = second quarter of life, depreciation slightly slower than age, sweet spot
underlined = second half of life, very slow depreciation, running but might need expensive repairs depending on model and use.
crossed-out = exceeded its expected life, each day is a gift, wheels might fall off tomorrow.

### Sources about life span:
https://autorecyclingworld.com/what-is-the-lifespan-of-a-vehicle-in-the-usa/
https://www.iseecars.com/longest-lasting-cars-study
https://www.caranddriver.com/auto-loans/a32880477/average-mileage-per-year/
https://www.youtube.com/watch?v=p2Lj5hJU5Ns&pp=ygUSaG93IGxvbmcgY2FycyBsYXN0

# How to install from source:

run `npm install` then `npm run build` in root directory, then temporarily load manifest.json from build/firefox

# Acknowledgements / Dependencies:

Sveltekit extension adapter: https://github.com/michmich112/sveltekit-adapter-chrome-extension

chartjs: https://github.com/chartjs/Chart.js

<a href="https://www.flaticon.com/free-icons/car-wash" title="car wash icons">Car wash icons created by surang - Flaticon</a>