import adapter from 'sveltekit-adapter-chrome-extension';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build/firefox',
			assets: 'build/firefox',
			fallback: null,
			precompress: false,
			manifest: 'manifest.json',
		})
	}
};

export default config;
