import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts', './src/init-env.ts'],
  format: 'esm',
  dts: true,
  clean: true,
});
