# sockpuppetbrowser watchdog

## The failure this fixes

Watches that use the *Chrome/Javascript* fetch method (`html_webdriver`) fail with:

```text
Exception: BrowserType.connect_over_cdp: Target page, context or browser has been closed
Call log:
  - <ws connecting> ws://sockpuppetbrowser:3000/
  - <ws connected> ws://sockpuppetbrowser:3000/
  - <ws disconnected> ws://sockpuppetbrowser:3000/ code=1000 reason=""
```

The websocket connects and then closes immediately, with a *normal* close code and no reason.
That is the signature of sockpuppetbrowser refusing the connection because its browser pool is full.
It is not a problem with the page being fetched.
The same pages load fine in an ordinary browser, and they load fine through sockpuppetbrowser once a slot is free.

Two separate things cause the pool to fill up.

### 1. Fewer browser slots than fetch workers

changedetection.io runs *N* fetch workers in parallel.
sockpuppetbrowser allows at most `MAX_CONCURRENT_CHROME_PROCESSES` browsers at once.
When workers outnumber slots, the surplus workers get their connection closed the instant they connect.

Keep `MAX_CONCURRENT_CHROME_PROCESSES` comfortably above the worker count.
The worker count lives in the changedetection.io UI under *Settings → Requests → Maximum number of workers*.

### 2. Leaked slots

sockpuppetbrowser has no per-session timeout.
A slot is released only when the client websocket closes.
If a Playwright client dies without closing cleanly — a changedetection.io restart, a host power-off mid-fetch, a half-open socket — the slot is held forever.

Nothing recovers from this on its own:

- `restart: unless-stopped` does not help, because the process never crashes.
- The `?timeout=` parameter changedetection.io puts in the CDP URL is not a session timeout; sockpuppetbrowser ignores it for this purpose.
- Docker marks the container unhealthy via the healthcheck in `docker-compose.yml`, but Docker does not restart unhealthy containers by itself.

Once every slot has leaked, *all* browser-backed watches fail, permanently, until someone restarts the container.

## What the watchdog does

`sockpuppet-watchdog.sh` polls the sockpuppetbrowser stats endpoint every 5 minutes and restarts the container when the pool is wedged.

It distinguishes *wedged* from merely *busy*.
A busy pool keeps retiring connections, so `connection_count_total` climbs.
A wedged pool sits at full capacity with `connection_count_total` frozen.
The script restarts only when **both** conditions hold on two consecutive polls, so a genuinely saturated pool is never killed mid-work.

## Installation

It is already installed.
For reference, or to reinstall:

```sh
chmod +x ~/ResourceGuide/monitoring/sockpuppet-watchdog.sh
cp ~/ResourceGuide/monitoring/sockpuppet-watchdog.{service,timer} ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now sockpuppet-watchdog.timer
loginctl enable-linger "$USER"   # so the timer runs when you are logged out
```

The unit files are kept in this directory and copied into `~/.config/systemd/user/`, which is where systemd actually reads them from:

- `sockpuppet-watchdog.service` — a `oneshot` unit that runs the script
- `sockpuppet-watchdog.timer` — fires 5 minutes after boot, then every 5 minutes

The `.service` file hardcodes an absolute `ExecStart` path; adjust it if the repo lives somewhere other than `~/ResourceGuide`.

## Checking on it

```sh
# Live pool state. active_connections at max with a frozen
# connection_count_total is the wedge signature.
curl -s http://127.0.0.1:8080/stats | jq

# Docker's own view
docker inspect -f '{{.State.Health.Status}}' monitoring-sockpuppetbrowser-1

# When did the watchdog last run, and did it act?
systemctl --user list-timers sockpuppet-watchdog.timer
journalctl --user -u sockpuppet-watchdog.service --since '24 hours ago'

# Run it once by hand
systemctl --user start sockpuppet-watchdog.service
```

A run that finds nothing wrong prints nothing.
A run that acts logs the capacity numbers and the restart.

## Tuning

The script reads its capacity threshold from the container's own `MAX_CONCURRENT_CHROME_PROCESSES`, so raising that value in `docker-compose.yml` needs no change here.

Environment overrides, if you need them:

| Variable | Default | Meaning |
| --- | --- | --- |
| `SOCKPUPPET_CONTAINER` | `monitoring-sockpuppetbrowser-1` | Container to poll and restart |
| `SOCKPUPPET_STATS_URL` | `http://127.0.0.1:8080/stats` | Stats endpoint |
| `SOCKPUPPET_STRIKES` | `2` | Consecutive wedged polls before restarting |

## Recovering by hand

If you would rather not wait for the timer:

```sh
docker restart monitoring-sockpuppetbrowser-1
```

Then requeue the watches that failed.
In the UI, filter by *With errors* and use *Recheck all*, or via the API:

```sh
TOKEN=<your api key from Settings → API>
curl -s "http://localhost:5000/api/v1/watch/<uuid>?recheck=1" -H "x-api-key: $TOKEN"
```
