#!/bin/sh
# Prepara um servidor Ubuntu: libera 80/443 no firewall da própria máquina, instala Docker e rclone.
# Rode uma vez, como root ou com sudo.
set -e

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root ou com sudo: sudo sh deploy/setup-server.sh" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl git rclone iptables-persistent

for port in 80 443; do
  iptables -C INPUT -p tcp --dport "$port" -m conntrack --ctstate NEW -j ACCEPT 2>/dev/null ||
    iptables -I INPUT -p tcp --dport "$port" -m conntrack --ctstate NEW -j ACCEPT
done
netfilter-persistent save

if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
if [ -n "$SUDO_USER" ]; then
  usermod -aG docker "$SUDO_USER"
  echo "Saia e entre de novo no SSH para usar o docker sem sudo."
fi

echo "Pronto."
