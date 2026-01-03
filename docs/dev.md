## Tooling Notes

Some npm deprecation warnings appear during install due to transitive
dependencies in Jest and jsdom (e.g. inflight, glob@7).

These are dev-only dependencies and do not impact production builds.
They will be resolved upstream as the ecosystem migrates.





## Run Command
npm run dev -- -p 3000 -H 127.0.0.1
