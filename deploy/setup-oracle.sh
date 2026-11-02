#!/bin/sh
# Prepara uma VM Ubuntu da Oracle Cloud: libera 80/443 no firewall da própria VM, instala Docker e rclone.
# Rode uma vez, com sudo. As portas também precisam estar abertas na Security List, no painel da Oracle.
set -e

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode com sudo: sudo sh deploy/setup-oracle.sh" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl git rclone iptables-persistent

# As imagens Ubuntu da Oracle bloqueiam quase tudo no iptables, mesmo com a Security List aberta.
for port in 80 443; do
  iptables -C INPUT -p tcp --dport "$port" -m conntrack --ctstate NEW -j ACCEPT 2>/dev/null ||
    iptables -I INPUT -p tcp --dport "$port" -m conntrack --ctstate NEW -j ACCEPT
done
netfilter-persistent save

if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
usermod -aG docker "${SUDO_USER:-ubuntu}"

echo "Pronto. Saia e entre de novo no SSH para usar o docker sem sudo."
