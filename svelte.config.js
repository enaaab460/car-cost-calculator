import adapter from 'sveltekit-adapter-chrome-extension';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build/android',
			assets: 'build/android',
			manifest: 'manifest.json',
		}),
		appDir: 'app',
	}
};

export default config;
