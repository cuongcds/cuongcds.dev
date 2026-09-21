// Standalone entry (`npm run stats`); the Astro integration calls refreshStats()
// directly at build start.
import { refreshStats } from './stats-pipeline.mjs';

await refreshStats();
