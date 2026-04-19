import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		assetsDir: "artifact-copium/assets",
	},
	plugins: [
		tailwindcss(),
		preact({
			prerender: {
				enabled: true,
				renderTarget: '#app',
			},
		}),
	],
});
