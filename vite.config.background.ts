import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		outDir: 'build/firefox', 
		emptyOutDir: false, 
		minify: false,
		rollupOptions: {
			input: {
				background: './src/background.ts',
			},
			output: {
				entryFileNames: 'background.js',
				chunkFileNames: 'background-[hash].js', 
				assetFileNames: 'background-[hash].[ext]',
			},
		},
	},
});