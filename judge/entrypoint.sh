#!/bin/sh
set -e

# Delegate a cgroup v2 subtree to isolate. The container starts with all of
# its own processes sitting directly in the root cgroup, which cgroup v2
# forbids enabling controllers on ("no internal process" rule) - so first
# move everything into a sibling "init" cgroup, then enable controllers for
# the (now process-free) root, then carve out "isolate" for sandboxed runs.
mount -o remount,rw /sys/fs/cgroup

mkdir -p /sys/fs/cgroup/init
for pid in $(cat /sys/fs/cgroup/cgroup.procs); do
  echo "$pid" > /sys/fs/cgroup/init/cgroup.procs 2>/dev/null || true
done
echo "+pids +memory +cpu" > /sys/fs/cgroup/cgroup.subtree_control

mkdir -p /sys/fs/cgroup/isolate
echo "+pids +memory +cpu" > /sys/fs/cgroup/isolate/cgroup.subtree_control

echo "[entrypoint] cgroup delegation ready for isolate"

exec "$@"
