# ShoutOut

Recognise the people who make work better. ShoutOut is an internal kudos
platform: send a colleague a card, tag a company value and say thanks.

See [docs/PRODUCT.md](docs/PRODUCT.md) for scope and milestones and
[docs/BRAND.md](docs/BRAND.md) for the brand guidelines (live style guide at `/brand`).

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4) — UI and server in one app
- **Auth.js v5** with **Keycloak** (OIDC); roles `shoutout-user` / `shoutout-admin`
- **PostgreSQL 17** via **Prisma 7**
- **Vitest** (unit, component, integration with Testcontainers) and **Playwright** (E2E)
- **Docker** images and a **Helm** chart (app + PostgreSQL + Keycloak)

## Local development

Requirements: Node 22, Docker (or Podman), k3d, kubectl, Helm.

```bash
npm install
npm run dev        # needs DATABASE_URL and AUTH_* env vars in .env.local
```

### Tests

```bash
npm run test:coverage   # unit + component + integration; fails below 90% coverage
npm run test:e2e        # Playwright against http://shoutout.localtest.me
```

Integration tests start PostgreSQL in a container via Testcontainers, so Docker
or Podman must be running.

### Deploy to local Kubernetes (k3d)

```bash
deploy/local/deploy.sh
```

This creates the `shoutout` k3d cluster if needed, builds the app and migration
images, loads them into the cluster, installs the Helm chart and runs `helm test`.

| URL                          | What                        |
| ---------------------------- | --------------------------- |
| http://shoutout.localtest.me | ShoutOut                    |
| http://auth.localtest.me     | Keycloak (realm `shoutout`) |

Demo users (local only, password `shoutout`): `alice` (admin), `bob`, `carol`,
`dave`, `erin`, `frank`, `grace`, `henry`.

Keycloak admin console password:

```bash
kubectl -n shoutout get secret shoutout-secrets -o jsonpath='{.data.keycloak-admin-password}' | base64 -d
```

## Helm chart

`deploy/helm/shoutout` deploys the app with an init container that runs
database migrations, plus optional bundled PostgreSQL and Keycloak. For real
environments, disable the bundled services and point at managed ones:

```yaml
appUrl: https://shoutout.example.com
postgres: { enabled: false }
keycloak: { enabled: false }
database: { existingSecret: shoutout-db, existingSecretKey: database-url }
auth: { issuer: https://sso.example.com/realms/example, clientId: shoutout-web }
secrets: { existingSecret: shoutout-secrets } # auth-secret, keycloak-client-secret
app:
  image: { tag: "1.0.0" }
  ingress: { className: nginx, host: shoutout.example.com, tls: [...] }
```

## License

MIT
