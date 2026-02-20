#!/bin/bash
set -e
# Réduire le warning Redis "Memory overcommit must be enabled" (si droits le permettent)
sysctl -w vm.overcommit_memory=1 2>/dev/null || true
redis-server --bind 0.0.0.0 &
exec /usr/sbin/sshd -D
