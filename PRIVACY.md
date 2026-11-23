# Privacy

Ensemble can send anonymous usage data to CzechSlash's PostHog project. It's **on by default**, and you can turn it off in **Settings → General → Privacy**.

## What's sent

Ensemble sends a report when something changes, and at most once a week otherwise:

- a random anonymous ID created on your device
- Ensemble version, operating system, Linux distribution and Proton version
- the number of Beat Saber installs and the active Beat Saber version
- the number of custom mod repositories, plus each repository's URL and whether it's enabled

GeoIP lookup is disabled. No account names, file paths, headset serials or IP-derived locations are stored with the data.

## What's not sent

Player data, scores, maps, mods you install, logs and anything about your headsets beyond the above.

## Contact

Open an issue at [github.com/CzechSlash/ensemble](https://github.com/CzechSlash/ensemble/issues).
