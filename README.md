# ShoutOut

Recognise the people who make work better. ShoutOut is an internal kudos
platform: send a colleague a card, tag a company value and say thanks.

See [docs/PRODUCT.md](docs/PRODUCT.md) for scope and milestones and
[docs/BRAND.md](docs/BRAND.md) for the brand guidelines (live style guide at `/brand`).

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4) — UI and server in one app
- **Auth.js v5** with **Keycloak** (OIDC); roles `shoutout-user` / `shoutout-admin`
- **PostgreSQL 17** with plain SQL via [`pg`](https://node-postgres.com) (no ORM); migrations are `.sql` files in `db/migrations`
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

### Database migrations

Schema changes are plain SQL files in `db/migrations`, applied in filename order by
`db/migrate.mjs` (each in a transaction, tracked in `schema_migrations`). In Kubernetes
the app pod's init container runs them; locally:

```bash
npm run db:migrate   # uses DATABASE_URL from the environment or .env
```

To change the schema, add a new file such as `db/migrations/20261001120000_add_x.sql`.
Never edit a migration that has already been applied.

### Security checks

```bash
npm run audit:deps                                   # npm audit, fails on high/critical
scripts/security-scan.sh shoutout:tag   # + Trivy image scan
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

This creates the `shoutout` k3d cluster if needed, builds the app image,
loads it into the cluster, installs the Helm chart and runs `helm test`.
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

### Installing the published chart

CI publishes the chart as an OCI artifact after the image for the same commit:

```bash
helm install shoutout oci://ghcr.io/opentooling/charts/shoutout -f my-values.yaml
helm show values oci://ghcr.io/opentooling/charts/shoutout      # all settings
```

Chart versions are `<major.minor from Chart.yaml>.<CI run number>`, so a plain
install gets the newest. Each chart's `appVersion` (the default image tag) is
the `sha-<commit>` image built from the same commit. Pin with `--version`.

### OpenShift

Set `openshift.enabled: true` to run under the `restricted-v2` SCC. Pods then
omit fixed `runAsUser`/`runAsGroup`/`fsGroup` so OpenShift assigns them from the
namespace range; every container already runs non-root with all capabilities
dropped, no privilege escalation and the `RuntimeDefault` seccomp profile, and
all images work with an arbitrary UID. Ingresses are turned into Routes by
OpenShift; to control Routes directly, disable the ingresses and add Routes via
`extraObjects`.

### Extra objects

`extraObjects` deploys additional manifests with the release, such as custom
resources your platform needs (their CRDs must already be installed). Items may
be YAML objects or strings, and are rendered with `tpl`:

```yaml
extraObjects:
  - apiVersion: route.openshift.io/v1
    kind: Route
    metadata:
      name: '{{ include "shoutout.fullname" $ }}-app'
    spec:
      host: shoutout.apps.example.com
      to: { kind: Service, name: '{{ include "shoutout.fullname" $ }}-app' }
      port: { targetPort: http }
      tls: { termination: edge }
```

## Container image

CI publishes a multi-arch (amd64 + arm64) image to
`ghcr.io/opentooling/shoutout` for every commit on `main` that passes tests,
Helm lint, `npm audit` and the Trivy scan. Tags: `sha-<short commit>`,
`sha-<full commit>`, `main` and `latest`.

Publishing to the `opentooling` org needs credentials that can write there:
either host the repository in that org, or add a `GHCR_TOKEN` repository
secret (a classic PAT with `write:packages` from an org member) and a
`GHCR_USERNAME` variable. Without them CI still builds and scans, and skips
publishing with a notice.

To run the published image in the local k3d cluster instead of building:

```bash
GHCR_TAG=main deploy/local/deploy.sh      # or latest, sha-<commit>
```

The package must be public (or the cluster given a pull secret).

## License

MIT
