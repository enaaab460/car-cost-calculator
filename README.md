# Intro

Calculator to estimate the cost of used cars using double-declining balance (DDB) depreciation. Can link to other websites: KBB, edmunds.

There is no backend and no telemetry. Not affiliated with any website or service, preloaded in the app or otherwise.

Price is calculated as $$\text{Price} = (1 - 2/\text{life})^\text{years} \cdot \text{new-OTD-price}$$

where $$\text{years} = (\text{age of model} + (\text{odometer} / \text{yearlyOdometer})) / 2$$

where the car is in very good or excellent condition, is very commonly available (not exotic, 10k+ listings for the model, 100+ for the trim and year on visor.vin for example), and its price throughout the years matches inflation.

where life is assumed to be around 10 to 20 years, at ~~13.5k~~ 10k miles a year (can be changed in the settings, read Average yearly driven miles Tangent). Research should be done about the reliability of the brand, model, specific years, and the maintenance of the specific car. Sources at the end of the page might be a good starting point. Less reliable cars are closer to 10 years (~~135k~~ 100k miles) and more reliable are closer to 20 years (~~270k~~ 200k miles), assuming excellent condition and maintenance. Life is not simply the expected lifespan of the drivetrain. A running car can be also be totaled if it needs expensive repairs (relative to the remaining value of the car) or if parts are no longer available. Rust rots and condition of interior and exterior degrades with time regardless of miles. Even though there are exceptions, turbos, cvts, hybrid/battery systems, and head gaskets are common headaches to look out for when researching reliability.

## Quick notes 
Extension made with miles and american websites in mind, but kilometers and other websites were retrofitted. It was also made with cars beyond the year 2000 but support for 2000 and earlier was retrofitted.

Suggested fair price is merely a mathematical approximation, with no consideration for market factors. 

Double-declining rate allowed mirroring common depreciation rates (after the usual 10% incentives are factored in): ~15% in the first year and ~55% in the first 5 years, in a car that lasts 15 years before being junked. 

## Simple calculator notes

OTD price, odometer, and price should be in thousands, i.e. 23 instead of 23000. don't add `k` after the number.

Hovering over year and odometer shows calculated age of car from each metric. Hovering over lifespan shows expected odometer at end of life.

Model year should be beyond 2000, i.e. 05 instead of 2005. If you need years before 2000, use negative numbers, i.e. -3 instead of 1997.

Allows plotting where the car stands relative to the depreciation curve, and price styles. If the name of the car is the same as KBB, then using the KBB button will allow quick access to kbb price estimator. If the trim is also the same, the right clicking will provide 1-click shortcut. Edmunds support is also available but is mainly useful for specs, recalls, and suggested OTD price. Not affiliated with either. When choosing trims, I would recommend either picking the least trim that has all the features you need, or the most popular one.

## Explanation of price style

* yellow = >50% below fair price -> just downpayment / need extensive repairs / branded title / project car / lemon / (insane / impossible deal)

* green = below haggled percent (15% by default) from fair price -> many have branded title (in my experience) or rental but some might not (best option if mechanically sound, might not have room for negotiation).

* cyan = below fair price but not green -> some might be branded but many won't (sweet spot)

* purple = above fair price but not red (sweet spot)

* red = haggling (15% by default) won't reach below the fair price. if most cars are red and model is not in limited supply, considering buying new.

* brown = >50% over fair price. very bad price (if msrp and lifespan are correct)

* italic = first quarter of life, depreciation faster than age, possibly newest facelift.

* bland = second quarter of life, depreciation slightly slower than age (sweet spot), possibly 1 facelift old.

* underlined = second half of life, very slow depreciation, running but might need major repairs depending on model and use, possibly >1 generation old.

* crossed-out = exceeded its expected life, wheels might fall off tomorrow. Depending on the brand, it might be in "good" shape, but expensive to repair (relative to actual car value).

15% default haggle is almost too much, but it increases the range of cyan and purple. It can be changed in the settings. Not reaching the fair price does not necessarily mean a bad deal. It is all relative to your car market. It is said that margins are too narrow in used car dealerships for a 15% discount, so might need to aim lower. KBB can be used to verify the fair price for a particular model, trim, year, and mileage, but many think that KBB prices are too low. I could not integrate Carfax Value, but many think that it is too high.

## Out-the-door price tangent
MSRP + non-negotiable fees (gorvernmental or dealer, like taxes or destination fees) - incentives.
Most cars can have >10% incentives, which is the main reason cars are said to lose 10% the moment they are driven off the lot (as new). Brands that do not offer such incentives (namely Toyota) don't have this "issue", which is part of the reason they hold their value more. Other brands have inflate MSRP then offer incentives. Electric cars are also said to lose a lot of their value even if that inflated price was usually not paid, since they offer(ed) significant incentives. Edmunds and KBB can be used as a reference for OTD price in the USA. If days on lot are above target (~75 days for most brands, ~30 days for toyota, in the US), larger incentives might be possible. Ongoing prices should be checked regularly (eg, weekly).

## Toyota Tangent
Even if many toyotas regularly exceed 250k miles, this should not taken for granted. In the iseecars article below, most of their models reach 250k miles less than 20% of the time. Since they sell millions of cars, 20% of that is still millions, but many more won't reach that number. Some models and years had engine problems and needed recalls, like all manufacturers. They are the most reliable for sure, but not bullet-proof, and not barely broken in at 100k miles. Especially if you don't know how it was taken care of. Even if the drivetrain is alright, because the rest of the car might not, the car can be totaled regardless. It is fair to estimate the lifespan of their good models (not the GR86/BRZ, oil burning 2009 camry, the newest tacomas,...) to be 20 years, what I have found that many facebook marketplace judge corolla's depreciation as if they last 30+ years (or they were bought above MSRP). That said, many others still follow the curve of 20 year lifespan. ~40% of tacomas exceed 250k miles, according to the same article. But there are (relatively) many callbacks of toyota cars and trucks recently so avoid blind brand loyalty, and research individual models.

## Depreciation Tangent
If most cars are way above the depreciation curve, this could mean that the lifespan estimated is smaller than what the market agreed upon. The lifespan you chose might have been too conservative (eg, 10 years for a corolla), or because they believe that these cars hold their value (limited-production cars tend to hold their value, or even appreciate). If a car has lots of miles and is regularly only slightly cheaper than new, maybe buying it new makes more sense. It will be in better shape, you will have warranty (and peace of mind), you will know its maintanence exactly, and will have better finance and insurance rates. If you can't beat them, join them.

Covid cars were sold over MSRP, and were in short supply, that they inherently costed more. So they are expected to be overpriced. But they make little sense now that the market is correcting and they cost close to new.

Covid costed the market 10 million cars that weren't produced, and now that the average new car costs 50k, more people are heading towards used cars.* So greater demand and smaller supply pushed the prices upward. and inflation since covid is 25% according to CPI.

Exotic cars also don't typically follow the depreciation curve. They might not be the first option for those who value peace of mind because they might also be the most abused (red-lined, burnouts, aftermarket modifications, track days) or not generally reliable.

## Title/PPI Tangent

Branded cars are inherently more risky than clean title cars, but if they are properly discounted (25% to +50%), they might be worth it, if you can prove they were properly fixed. Insurance might be very expensive, or unavailable, and they might be illegal to drive on public roads, and might still require expensive or impossible repairs.

Clean title cars can also have unwelcome surprises, since repairs done outside insurance will not affect the title. Car history services can simplify the process a bit, but they should not replace a proper pre-purchase inspection (PPI). Read about car title washing.

## Average yearly driven miles Tangent

The 13.5k miles a year is average of all drivers and all driving, personal and commercial. Meaning taxi, cargo trucks, and other business vehicles push the average up. I could not find a source for median distance driven personally. If we consider that the average commute is 30 miles round trip a day, it would add up to 7.6k miles a year. But not all personal driving is commuting, so it is not the best metric either. Another metric is the difference between mens' (16.5k) and womens' (10.1k) yearly distance. If we assume that women are less likely to drive commercially than men, their yearly miles might better reflect average personal driving. Most leases are also 10k miles/year or less. Another metric would be the FHWA 2023 VMT, which puts the average miles travelled for light duty vehicles with short wheel base at 11k miles/year (including commercial). All subsitute metrics would decrease cars' value at 100k miles compared to the original 13.5k miles/year (less miles/year == more years' worth of depreciation/wear for a given distance). It is even more convoluted when we consider that city miles cause more wear than highway miles. If you are looking for a work vehicle / truck, increasing the yearly odometer more than 10k may be important.

### Sources:

\* Heard multiple times on Youtube but can't find source now

https://autorecyclingworld.com/what-is-the-lifespan-of-a-vehicle-in-the-usa/

https://www.iseecars.com/longest-lasting-cars-study

https://www.caranddriver.com/auto-loans/a32880477/average-mileage-per-year/

https://www.youtube.com/watch?v=p2Lj5hJU5Ns&pp=ygUSaG93IGxvbmcgY2FycyBsYXN0

https://www.kbb.com/car-depreciation/

https://carconfections.com/reliability-resale-value/

https://www.youtube.com/@TheCarCareNutReviews

https://caredge.com/guides/fastest-and-slowest-selling-cars-2025

https://www.fhwa.dot.gov/policyinformation/statistics/2023/vm1.cfm

# Disclaimers (might be superfluous)

No data is sent back to any back-end related to me. I have used the minimum number of dependancies I can, and yet I can not vouch for them personally. I can only vouch for what I wrote. NPM supply chain attacks not rare enough.

I have some experience in Svelte and JS, and have programmed for many years. But it is not my day job, so not all best practices were followed.

AI assisted in writing this extension, namely free Gemini 2.5 and chatgpt-5 in vscode. All code was revised and tested (to the best of my ability). Vibe-coding was attempted at multiple points, with varying degrees of success. It helped alot at figuring out the correct chrome apis and chartjs apis I needed, but was very frustrating at times and I had to roll back many prompts and write them myself. Aiding in bug fixes was more useful.

I am not in the automotive industry, many statements made in this post were read or heard online, and should be taken with a grain of salt.

# How to install:

## run online:
https://car-cost-calculator.pages.dev/

## from source locally:
run `npm install` then `npm run dev` in root directory, then browse `http://localhost:5173/`

# Acknowledgements / Dependencies:

Sveltekit: https://github.com/sveltejs/kit

chartjs: https://github.com/chartjs/Chart.js

<a href="https://www.flaticon.com/free-icons/car-wash" title="car wash icons">Car wash icons created by surang - Flaticon</a>