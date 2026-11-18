.PHONY: help install dev check start image setup-server rollback logs maintenance live check-mothership up down build verify test push deploy ship status ci-list ci-local setup

# ── Config (override on the CLI or in .env) ─────────────────────────────────
# The voipappz-api the server passes /api to — read from .env (VOIPAPPZ_API_URL), else the cloud.
MOTHERSHIP ?= $(shell sed -n 's/^VOIPAPPZ_API_URL=//p' .env 2>/dev/null | head -1 | tr -d '\r"')
MOTHERSHIP := $(if $(MOTHERSHIP),$(MOTHERSHIP),https://cloud.voipappz.io)

# Local stack endpoints
SERVER   ?= http://localhost:3000
WEB_APP  ?= http://localhost:4200

# Production URL for `make status` — set PROD_URL in .env (or on the CLI).
PROD_URL ?= $(shell sed -n 's/^PROD_URL=//p' .env 2>/dev/null | head -1 | tr -d '\r"')

.DEFAULT_GOAL := help

help: ## Show this help
	@awk 'BEGIN{FS=":.*## ";printf "\nmake \033[36m<target>\033[0m\n\n"} \
	      /^[a-zA-Z0-9_-]+:.*## / {printf "  \033[36m%-16s\033[0m %s\n",$$1,$$2}' $(MAKEFILE_LIST)

install: .env ## First run: create .env from .env.example and install packages
	npm install

.env:
	cp .env.example .env
	@echo "created .env from .env.example: set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"

node_modules: package-lock.json
	npm install
	@touch node_modules

dev: .env node_modules ## Run the app: Hono (:3000) + Vite with hot reload (:4200)
	@echo "→ http://localhost:4200"
	npm run dev:all

check: node_modules ## Everything CI checks: lint, unit tests (React + server), build
	npm run lint
	npm run test:run
	npm run build

start: build ## Serve the production build with the Hono server (http://localhost:3000)
	npm start

image: ## Build the production image and run it on http://localhost:3000
	docker build -f Dockerfile.production -t voipappz-app:local .
	docker run --rm -p 3000:3000 --env-file .env -e NODE_ENV=production voipappz-app:local

check-mothership: ## Verify voipappz-api (VOIPAPPZ_API_URL) is reachable
	@echo "==> Mothership (override: MOTHERSHIP=https://<host>)"
	@code=$$(curl -s -o /dev/null -w '%{http_code}' "$(MOTHERSHIP)/tasks/customer_portal_data" --max-time 5); \
	  case $$code in [234]*) s="OK ($$code)";; *) s="UNREACHABLE ($$code) — set VOIPAPPZ_API_URL in .env";; esac; \
	  printf "  %-11s %-34s %s\n" "mothership" "$(MOTHERSHIP)" "$$s"

up: ## Start the app in Docker (Hono + Vite)
	docker compose up -d app
	@echo "web → $(WEB_APP)   server → $(SERVER)"

down: ## Stop all services
	docker compose down

build: node_modules ## Production build → dist/
	npm run build

verify: ## Health check: the Hono server and the web app
	@printf "  %-9s %-30s " "server" "$(SERVER)/health"; curl -sf -o /dev/null "$(SERVER)/health" && echo OK || echo DOWN
	@printf "  %-9s %-30s " "web/vite" "$(WEB_APP)/";     curl -sf -o /dev/null "$(WEB_APP)/"     && echo OK || echo DOWN

ci-list: ## List the GitHub Actions jobs act can run locally
	act -l

setup: ## Set up a Supabase project for this app: migrations, lock sign-ups, print env (ARGS="--check" | "--admin-email a@b.co")
	@node scripts/setup-supabase.mjs $(ARGS)

ci-local: ## Run the CI workflow locally with act (pull_request event; JOB=<id> for one job)
	@test -f .vars || cp .vars.example .vars
	@test -f .secrets || cp .secrets.example .secrets
	act pull_request -W .github/workflows/ci.yml $(if $(JOB),-j $(JOB),)

test: ## Run all Playwright tests (needs the app running)
	npx playwright test

# Kamal needs ruby-3.3.5 and .kamal/secrets sourced for ERB substitution in
# config/deploy.yml (Kamal only auto-sources it for the registry password).
KAMAL ?= kamal

push: ## git push current branch to origin
	git push

deploy: ## Deploy to a customer: make deploy DEST=<customer> (config/deploy.<customer>.yml)
	@test -n "$(DEST)" || { echo "usage: make deploy DEST=<customer>"; exit 1; }
	@set -a; . .kamal/secrets; set +a; $(KAMAL) deploy -d $(DEST)

ship: push deploy ## git push + make deploy DEST=<customer> in one shot

setup-server: ## First deploy to a NEW server: installs Docker + kamal-proxy, then deploys (DEST=<customer>)
	@test -n "$(DEST)" || { echo "usage: make setup-server DEST=<customer>"; exit 1; }
	@set -a; . .kamal/secrets; set +a; $(KAMAL) setup -d $(DEST)

rollback: ## Go back to an earlier release: make rollback DEST=<customer> VERSION=<git sha>
	@test -n "$(DEST)" -a -n "$(VERSION)" || { echo "usage: make rollback DEST=<customer> VERSION=<sha>"; exit 1; }
	@set -a; . .kamal/secrets; set +a; $(KAMAL) rollback $(VERSION) -d $(DEST)

logs: ## Follow the app's logs on the server (DEST=<customer>)
	@test -n "$(DEST)" || { echo "usage: make logs DEST=<customer>"; exit 1; }
	@set -a; . .kamal/secrets; set +a; $(KAMAL) app logs -f -d $(DEST)

maintenance: ## Show a maintenance page instead of the app (DEST=<customer>); undo with make live
	@test -n "$(DEST)" || { echo "usage: make maintenance DEST=<customer>"; exit 1; }
	@set -a; . .kamal/secrets; set +a; $(KAMAL) app maintenance -d $(DEST)

live: ## Back from maintenance (DEST=<customer>)
	@test -n "$(DEST)" || { echo "usage: make live DEST=<customer>"; exit 1; }
	@set -a; . .kamal/secrets; set +a; $(KAMAL) app live -d $(DEST)

status: ## Local git + production health + deployed version
	@echo "=== Local git ==="
	@git log --oneline -1
	@git status -sb
	@echo
	@if [ -z "$(PROD_URL)" ]; then \
	  echo "=== Production: PROD_URL not set (skip) — set PROD_URL in .env ==="; \
	else \
	  echo "=== Production ($(PROD_URL)) ==="; \
	  curl -s -o /dev/null -w "GET /      → %{http_code}\n" $(PROD_URL)/; \
	  curl -s -o /dev/null -w "GET /health → %{http_code}\n" $(PROD_URL)/health; \
	  echo "=== Deployed version ==="; \
	  curl -s $(PROD_URL)/health | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).version)}catch{console.log("unknown")}})'; \
	fi
