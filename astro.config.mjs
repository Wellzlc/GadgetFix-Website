// @ts-check
import { defineConfig } from 'astro/config';
// import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.gadgetfixllc.com',
  output: 'static',
  // adapter: netlify(),
  build: {
    // Extract CSS to external files for better caching
    inlineStylesheets: 'never'
  },
  compressHTML: true,
  // Image optimization settings
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  vite: {
    build: {
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
          passes: 2
        },
        format: {
          comments: false
        }
      },
      // Optimize rollup output
      rollupOptions: {
        output: {
          manualChunks: {
            // Group vendor libraries
            'vendor': ['astro:content']
          }
        }
      }
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [],
      exclude: ['@astrojs/netlify']
    },
    // Enable compression
    plugins: [],
    // Optimize CSS
    css: {
      devSourcemap: false,
      modules: {
        generateScopedName: '[hash:8]'
      }
    }
  }
});
