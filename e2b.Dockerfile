# You can use most Debian-based base images
FROM ubuntu:22.04
FROM ghcr.io/stackblitz-labs/bolt.diy:sha-7408fc7

RUN command: docker pull ghcr.io/stackblitz-labs/bolt.diy:main