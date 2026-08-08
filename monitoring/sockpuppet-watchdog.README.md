# monitoring stack watchdog

The watchdog covers two independent ways the monitoring stack stops checking watches.
Neither recovers on its own, and neither crashes anything, so `restart: unless-stopped` never fires.

- **[A wedged browser pool](#failure-a-a-wedged-browser-pool)** — browser-backed watches fail instantly with a CDP error.
- **[A deadlocked worker pool](#failure-b-a-deadlocked-worker-pool)** — *every* watch silently stops being checked, including plain-HTTP ones.

Failure B is the more damaging of the two, and it can occur while the browser pool still looks healthy.

## Failure A: a wedged browser pool

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

### Fewer browser slots than fetch workers

changedetection.io runs *N* fetch workers in parallel.
sockpuppetbrowser allows at most `MAX_CONCURRENT_CHROME_PROCESSES` browsers at once.
When workers outnumber slots, the surplus workers get their connection closed the instant they connect.

Keep `MAX_CONCURRENT_CHROME_PROCESSES` comfortably above the worker count.
The worker count lives in the changedetection.io UI under *Settings → Requests → Maximum number of workers*.

### Leaked slots

sockpuppetbrowser has no per-session timeout.
A slot is released only when the client websocket closes.
If a Playwright client dies without closing cleanly — a changedetection.io restart, a host power-off mid-fetch, a half-open socket — the slot is held forever.

Nothing recovers from this on its own:

- `restart: unless-stopped` does not help, because the process never crashes.
- The `?timeout=` parameter changedetection.io puts in the CDP URL is not a session timeout; sockpuppetbrowser ignores it for this purpose.
- Docker marks the container unhealthy via the healthcheck in `docker-compose.yml`, but Docker does not restart unhealthy containers by itself.

Once every slot has leaked, *all* browser-backed watches fail, permanently, until someone restarts the container.

## Failure B: a deadlocked worker pool

A browser-backed watch can hang inside Playwright past any timeout configured in the UI.
The worker that claimed it never finishes and never picks up another job.
Once every worker is stuck, the queue stops draining entirely — including plain-HTTP watches that never touch the browser at all.

The symptom is a *Queued size* that only ever grows, with no watch being checked.
In the changedetection.io log it looks like a wall of `Queued watch UUID ...` lines with no matching `Worker N completed ...`.

This mode does **not** require the browser pool to be full.
Some slots leak, the rest stay free, and a pure capacity check reports everything healthy while nothing is actually being monitored.

Document-style URLs are repeat offenders — Chrome's PDF viewer is a common place to hang.
See [Watches that hang the browser](#watches-that-hang-the-browser) below.

## What the watchdog does

`sockpuppet-watchdog.sh` runs every 5 minutes and makes two independent checks.

**Check A — is the browser pool wedged?**
A busy pool keeps retiring connections, so `connection_count_total` climbs.
A wedged pool sits at full capacity with `connection_count_total` frozen.
When both hold on 2 consecutive polls, it restarts sockpuppetbrowser.

**Check B — is the queue draining?**
A draining queue shrinks.
When the queue is non-empty and has not shrunk across 3 consecutive polls, the script confirms with the decisive signal: the most recent `last_checked` across all watches.
If no watch at all has been checked in the last 20 minutes, the workers really are stuck, and it restarts changedetection.io along with sockpuppetbrowser.
If some watch *was* checked recently, the queue is merely busy and nothing is restarted.

Both checks require their symptom to persist across several polls, so a merely loaded system is never restarted mid-work.

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
# connection_count_total is the wedge signature (failure A).
curl -s http://127.0.0.1:8080/stats | jq

# Queue state. A queue_size that only ever grows is the
# deadlock signature (failure B).
TOKEN=$(jq -r .settings.application.api_access_token \
          ~/ResourceGuide/monitoring/changedetection-data/url-watches.json)
curl -s http://localhost:5000/api/v1/systeminfo -H "x-api-key: $TOKEN" | jq .queue_size

# Is anything actually being checked? Minutes since the most
# recent check across all watches; a large number means stuck.
curl -s http://localhost:5000/api/v1/watch -H "x-api-key: $TOKEN" \
  | jq "(now - ([.[].last_checked // 0] | max)) / 60 | floor"

# Docker's own view
docker inspect -f '{{.State.Health.Status}}' monitoring-sockpuppetbrowser-1

# When did the watchdog last run, and did it act?
systemctl --user list-timers sockpuppet-watchdog.timer
journalctl --user -u sockpuppet-watchdog.service --since '24 hours ago'

# Run it once by hand
systemctl --user start sockpuppet-watchdog.service
```

A run that finds nothing wrong prints nothing.
A run that acts logs the numbers it saw and what it restarted.

## Watches that hang the browser

Failure B is usually triggered by a specific watch rather than by load.
Document-style URLs on the *Chrome/Javascript* backend are the usual cause, because Chrome's PDF viewer can hang indefinitely.

To list them:

```sh
TOKEN=$(jq -r .settings.application.api_access_token \
          ~/ResourceGuide/monitoring/changedetection-data/url-watches.json)
curl -s http://localhost:5000/api/v1/watch -H "x-api-key: $TOKEN" \
  | jq -r 'to_entries[] | select(.value.url | test("showpublisheddocument|\\.pdf$|/documentcenter/view/"; "i")) | "\(.key) \(.value.url)"'
```

PDFs do not need JavaScript rendering.
Switching these watches to *Basic fast Plaintext/HTTP Client* both avoids the hang and lets changedetection.io extract the PDF text directly.

## Tuning

The script reads its capacity threshold from the container's own `MAX_CONCURRENT_CHROME_PROCESSES`, so raising that value in `docker-compose.yml` needs no change here.

Environment overrides, if you need them:

| Variable | Default | Meaning |
| --- | --- | --- |
| `SOCKPUPPET_CONTAINER` | `monitoring-sockpuppetbrowser-1` | Browser container to poll and restart |
| `CHANGEDETECTION_CONTAINER` | `changedetection` | App container to restart on a worker deadlock |
| `SOCKPUPPET_STATS_URL` | `http://127.0.0.1:8080/stats` | Browser pool stats endpoint |
| `CHANGEDETECTION_URL` | `http://localhost:5000` | changedetection.io base URL |
| `CHANGEDETECTION_DATASTORE` | `.../changedetection-data/url-watches.json` | Where the script reads the API token |
| `SOCKPUPPET_STRIKES` | `2` | Consecutive wedged-pool polls before restarting |
| `QUEUE_STRIKES` | `3` | Consecutive non-draining-queue polls before confirming |
| `STALL_MINUTES` | `20` | No watch checked in this long confirms a deadlock |

## Recovering by hand

If you would rather not wait for the timer:

For a wedged browser pool (failure A), restarting the browser is enough:

```sh
docker restart monitoring-sockpuppetbrowser-1
```

For a deadlocked worker pool (failure B), restart both, browser first so the app comes up against a clean pool:

```sh
docker restart monitoring-sockpuppetbrowser-1
docker restart changedetection
```

The queue drains on its own afterwards; there is no need to requeue anything, because the overdue watches are still queued.

To requeue watches that failed with an error rather than a stall, filter by *With errors* in the UI and use *Recheck all*, or via the API:

```sh
TOKEN=<your api key from Settings → API>
curl -s "http://localhost:5000/api/v1/watch/<uuid>?recheck=1" -H "x-api-key: $TOKEN"
```
