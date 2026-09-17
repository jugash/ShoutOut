{{- define "shoutout.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "shoutout.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "shoutout.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Common labels. Call with (dict "ctx" $ "component" "app") */}}
{{- define "shoutout.labels" -}}
helm.sh/chart: {{ include "shoutout.chart" .ctx }}
{{ include "shoutout.selectorLabels" . }}
app.kubernetes.io/version: {{ .ctx.Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .ctx.Release.Service }}
app.kubernetes.io/part-of: shoutout
{{- end }}

{{- define "shoutout.selectorLabels" -}}
app.kubernetes.io/name: {{ include "shoutout.name" .ctx }}
app.kubernetes.io/instance: {{ .ctx.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{- define "shoutout.secretName" -}}
{{- default (printf "%s-secrets" (include "shoutout.fullname" .)) .Values.secrets.existingSecret }}
{{- end }}

{{/*
Resolve a secret value: explicit value > value already in the cluster > random.
Call with (dict "ctx" $ "key" "auth-secret" "value" .Values.secrets.authSecret)
*/}}
{{- define "shoutout.secretValue" -}}
{{- $existing := lookup "v1" "Secret" .ctx.Release.Namespace (include "shoutout.secretName" .ctx) -}}
{{- $data := (get $existing "data") | default dict -}}
{{- if .value -}}
{{- .value -}}
{{- else if hasKey $data .key -}}
{{- index $data .key | b64dec -}}
{{- else -}}
{{- randAlphaNum 32 -}}
{{- end -}}
{{- end }}

{{- define "shoutout.postgres.host" -}}
{{- printf "%s-postgres" (include "shoutout.fullname" .) }}
{{- end }}

{{- define "shoutout.keycloak.url" -}}
{{- .Values.keycloak.url | trimSuffix "/" }}
{{- end }}

{{- define "shoutout.auth.issuer" -}}
{{- if .Values.auth.issuer }}
{{- .Values.auth.issuer | trimSuffix "/" }}
{{- else if .Values.keycloak.enabled }}
{{- printf "%s/realms/%s" (include "shoutout.keycloak.url" .) .Values.keycloak.realm.name }}
{{- else }}
{{- fail "auth.issuer is required when keycloak.enabled=false" }}
{{- end }}
{{- end }}

{{- define "shoutout.app.image" -}}
{{- $tag := default .Chart.AppVersion .Values.app.image.tag -}}
{{- printf "%s:%s" .Values.app.image.repository $tag }}
{{- end }}

{{- define "shoutout.migrations.image" -}}
{{- $tag := default (default .Chart.AppVersion .Values.app.image.tag) .Values.app.migrations.image.tag -}}
{{- printf "%s:%s" .Values.app.migrations.image.repository $tag }}
{{- end }}

{{/* Env var that provides DATABASE_URL to the app and migrations. */}}
{{- define "shoutout.databaseUrlEnv" -}}
{{- if .Values.postgres.enabled }}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "shoutout.secretName" . }}
      key: postgres-password
- name: DATABASE_URL
  value: "postgresql://{{ .Values.postgres.username }}:$(POSTGRES_PASSWORD)@{{ include "shoutout.postgres.host" . }}:5432/{{ .Values.database.name }}?schema=public"
{{- else if .Values.database.existingSecret }}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ .Values.database.existingSecret }}
      key: {{ .Values.database.existingSecretKey }}
{{- else if .Values.database.url }}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "shoutout.secretName" . }}
      key: database-url
{{- else }}
{{- fail "database.url or database.existingSecret is required when postgres.enabled=false" }}
{{- end }}
{{- end }}
