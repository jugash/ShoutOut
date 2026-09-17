#!/usr/bin/env bash
# Build ShoutOut images and deploy the full stack to a local k3d cluster.
#   deploy/local/deploy.sh            build + deploy + helm test
#   SKIP_BUILD=1 deploy/local/deploy.sh   redeploy the last built tag
set -euo pipefail

CLUSTER="${CLUSTER:-shoutout}"
NAMESPACE="${NAMESPACE:-shoutout}"
RELEASE="${RELEASE:-shoutout}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TAG_FILE="$ROOT/deploy/local/.last-tag"

log() { printf '\033[1;36m==> %s\033[0m\n' "$*"; }

if ! k3d cluster list "$CLUSTER" >/dev/null 2>&1; then
  log "Creating k3d cluster '$CLUSTER'"
  k3d cluster create "$CLUSTER" --agents 1 -p "80:80@loadbalancer" -p "443:443@loadbalancer" --wait
fi
kubectl config use-context "k3d-$CLUSTER" >/dev/null

# Pods must reach Keycloak at the same issuer URL the browser uses, but
# *.localtest.me resolves to 127.0.0.1. Point it at the Traefik ingress instead.
log "Configuring in-cluster DNS for auth.localtest.me"
until TRAEFIK_IP="$(kubectl -n kube-system get svc traefik -o jsonpath='{.spec.clusterIP}' 2>/dev/null)" && [[ -n "$TRAEFIK_IP" ]]; do
  sleep 2
done
kubectl apply -f - >/dev/null <<YAML
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns-custom
  namespace: kube-system
data:
  shoutout.server: |
    auth.localtest.me:53 {
      hosts {
        $TRAEFIK_IP auth.localtest.me
      }
    }
YAML
kubectl -n kube-system rollout restart deployment coredns >/dev/null
kubectl -n kube-system rollout status deployment coredns --timeout=120s >/dev/null

if [[ -z "${SKIP_BUILD:-}" ]]; then
  TAG="$(git -C "$ROOT" rev-parse --short HEAD)-$(date +%s)"
  log "Building images (tag $TAG)"
  docker build -q -t "shoutout:$TAG" "$ROOT" >/dev/null
  docker build -q --target migrator -t "shoutout-migrate:$TAG" "$ROOT" >/dev/null
  for node in $(k3d node list --no-headers | awk -v c="$CLUSTER" '$3==c && ($2=="server" || $2=="agent") {print $1}'); do
    log "Importing images into $node"
    docker save "shoutout:$TAG" "shoutout-migrate:$TAG" | docker exec -i "$node" ctr -n k8s.io images import - >/dev/null
  done
  echo "$TAG" > "$TAG_FILE"
else
  TAG="$(cat "$TAG_FILE")"
fi

log "Deploying Helm release '$RELEASE' to namespace '$NAMESPACE'"
helm upgrade --install "$RELEASE" "$ROOT/deploy/helm/shoutout" \
  --namespace "$NAMESPACE" --create-namespace \
  -f "$ROOT/deploy/local/values-local.yaml" \
  --set app.image.tag="$TAG" \
  --wait --timeout 10m

log "Running Helm tests"
helm test "$RELEASE" -n "$NAMESPACE"

kubectl -n "$NAMESPACE" get pods
log "ShoutOut:  http://shoutout.localtest.me"
log "Keycloak:  http://auth.localtest.me  (demo users: alice[admin], bob, carol... password: shoutout)"
