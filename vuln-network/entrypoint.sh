#!/bin/bash
set -e
redis-server --bind 0.0.0.0 &
exec /usr/sbin/sshd -D
