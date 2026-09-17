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

### Security checks

```bash
npm run audit:deps                                   # npm audit, fails on high/critical
scripts/security-scan.sh shoutout:tag shoutout-migrate:tag   # + Trivy image scan
```

`deploy/local/deploy.sh` runs both before deploying (skip with `SKIP_SECURITY_SCAN=1`).
CI runs `npm audit` and a Trivy scan of both images on every PR and weekly, and
Dependabot opens update PRs for npm packages, base images and GitHub Actions.
Images drop npm/yarn from the runtime and apply Alpine security updates. Accepted
findings go in `.trivyignore` with a reason and review date.

### Deploy to local Kubernetes (k3d)

```bash
deploy/local/deploy.sh
```

This creates the `shoutout` k3d cluster if needed, builds the app and migration
images, loads them into the cluster, installs the Helm chart and runs `helm test`.
Keycloak only imports the realm on first start; after changing realm settings run
`RESET_KEYCLOAK_REALM=1 deploy/local/deploy.sh` to re-import it (local only).

| URL                          | What                        |
| ---------------------------- | --------------------------- |
| http://shoutout.localtest.me | ShoutOut                    |
| http://auth.localtest.me     | Keycloak (realm `shoutout`) |

Optional demo data (about six months of shoutouts, so leaderboards and analytics have something to show):

```bash
deploy/local/seed-demo.sh           # add
deploy/local/seed-demo.sh --remove  # remove
```

Demo users (local only, password `shoutout`): `alice` (admin), `bob`, `carol`,
`dave`, `erin`, `frank`, `grace`, `henry`.

Keycloak admin console password:

```bash
kubectl -n shoutout get secret shoutout-secrets -o jsonpath='{.data.keycloak-admin-password}' | base64 -d
```

## Admin

Users with the Keycloak role `shoutout-admin` get an **Admin** area:

- **Moderation** – reported shoutouts are hidden straight away; restore or remove them.
- **Cards** – create cards from the built-in illustrations and colours, edit, reorder, retire.
- **Values** – add, rename, reorder and retire company values.
- **Export** – CSV downloads of shoutouts, a per-person summary and leaderboards.
- **Audit log** – who reported, moderated, changed or exported what.

## Configuration

| Env var                                    | Helm value                               | Default          | Meaning                                                                                  |
| ------------------------------------------ | ---------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `SHOUTOUT_QUARTERLY_BUDGET`                | `config.quarterlyBudget`                 | `20`             | Shoutouts per person per calendar quarter (each recipient uses one)                      |
| `SHOUTOUT_MAX_RECIPIENTS`                  | `config.maxRecipients`                   | `5`              | Most people in one shoutout                                                              |
| `SHOUTOUT_SYNC_ON_STARTUP`                 | `userSync.onStartup`                     | `true`           | Sync people from Keycloak when the app starts                                            |
| –                                          | `userSync.schedule`                      | `0 * * * *`      | CronJob schedule for the Keycloak people sync                                            |
| `SHOUTOUT_SYNC_TOKEN`                      | `secrets.syncToken`                      | generated        | Bearer token for `POST /api/internal/sync-users`                                         |
| `AUTH_KEYCLOAK_ISSUER` / `_ID` / `_SECRET` | `auth.*`, `secrets.keycloakClientSecret` | bundled Keycloak | OIDC client; its service account needs realm-management `view-users` for the people sync |

Example: `helm upgrade shoutout deploy/helm/shoutout --reuse-values --set config.quarterlyBudget=30`

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
