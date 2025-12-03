// place files you want to import through the `$lib` alias in this folder.

interface SelectorConfig {
	id: number;
	domain: string;
	calculationMode: 'single' | 'multiple';
	yearSelector: string;
	odometerSelector: string;
	priceSelector: string;
	carSelector: string; // For multiple listings
	excludeSelector?: string
}


interface CarPreset {
	id: number;
	name: string;
	msrp: number;
	life: number;
}

export type { SelectorConfig, CarPreset }