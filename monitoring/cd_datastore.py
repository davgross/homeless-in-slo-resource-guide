#!/usr/bin/env python3
"""
Root-level access to the changedetection.io datastore.

Since ~0.54 each watch is stored in its own ``<datastore>/<uuid>/watch.json``;
``changedetection.json`` holds application settings.  The legacy single
``url-watches.json`` file is no longer read or written by the application.

The container runs as root and writes ``watch.json`` with mode 0600, so the
host user cannot read or write those files directly.  These helpers do it by
shelling out to a throwaway container, which is the only reason they exist.
"""
import json
import os
import subprocess
import sys

DATASTORE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'changedetection-data')
IMAGE = 'ghcr.io/dgtlmoon/changedetection.io:latest'
CONTAINER = 'changedetection'

_READ_ALL = r'''
import json, os, sys
out = {}
for uuid in os.listdir('/datastore'):
    path = os.path.join('/datastore', uuid, 'watch.json')
    if not os.path.isfile(path):
        continue
    try:
        with open(path) as f:
            out[uuid] = json.load(f)
    except Exception as e:
        print('%s: %s' % (uuid, e), file=sys.stderr)
json.dump(out, sys.stdout)
'''

_WRITE_MERGE = r'''
import json, os, sys
updates = json.load(sys.stdin)
written, created = 0, 0
for uuid, fields in updates.items():
    d = os.path.join('/datastore', uuid)
    path = os.path.join(d, 'watch.json')
    if os.path.isfile(path):
        with open(path) as f:
            watch = json.load(f)
    else:
        os.makedirs(d, exist_ok=True)
        watch = {}
        created += 1
    watch.update(fields)
    tmp = path + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(watch, f, indent=2)
    os.chmod(tmp, 0o600)
    os.replace(tmp, path)
    written += 1
json.dump({'written': written, 'created': created}, sys.stdout)
'''


def container_running():
    """True if the changedetection container is currently up."""
    try:
        out = subprocess.run(
            ['docker', 'inspect', '-f', '{{.State.Running}}', CONTAINER],
            capture_output=True, text=True, timeout=15)
    except (OSError, subprocess.SubprocessError):
        return False
    return out.returncode == 0 and out.stdout.strip() == 'true'


def _run_in_container(script, stdin_data=None):
    cmd = ['docker', 'run', '--rm', '-i',
           '-v', '%s:/datastore' % DATASTORE,
           '--entrypoint', 'python3', IMAGE, '-c', script]
    proc = subprocess.run(cmd, input=stdin_data, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError('datastore helper container failed (exit %d):\n%s'
                           % (proc.returncode, proc.stderr.strip()))
    if proc.stderr.strip():
        print(proc.stderr.strip(), file=sys.stderr)
    return proc.stdout


def read_all_watches():
    """Return {uuid: watch dict} read from every <uuid>/watch.json."""
    return json.loads(_run_in_container(_READ_ALL))


def merge_watches(updates):
    """Merge {uuid: {field: value}} into each <uuid>/watch.json, preserving
    every field not named in the update.  Returns a counts dict."""
    return json.loads(_run_in_container(_WRITE_MERGE, json.dumps(updates)))
