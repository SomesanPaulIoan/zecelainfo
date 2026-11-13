# Deploy pe VPS (tot stack-ul în Docker)

## Ce include

- **PostgreSQL** — date aplicație; la prima pornire rulează scripturile din `database/`.
- **Redis** — cozi / cache.
- **Backend** — API Node (port 4000 în rețeaua Docker).
- **Frontend** — Next.js (port 3000 în rețea).
- **Nginx** — port **80** public, proxează `/api/*` → backend și restul → Next.
- **Judge** (opțional) — `docker compose ... --profile judge up -d` (container **privileged**, pentru `isolate`).

Volume persistent: date Postgres, Redis, facturi în `backend/storage`, PDF-uri BAC partajate între backend și frontend.

## Pași rapizi pe VPS (Ubuntu)

1. Instalează [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) + plugin Compose.
2. Clonează repo-ul pe server și intră în rădăcina lui (unde e `docker-compose.vps.yml`).
3. Copiază variabilele: `cp deploy/env.vps.example .env.vps` și editează **toate** valorile (parolă Postgres, chei Supabase, Revolut, SmartBill, SMTP, `JUDGE_SECRET`, etc.).
4. Setează **`PUBLIC_HOST`** la domeniul tău fără `https` (ex. `www.zecelainfo.ro`). Frontend-ul se construiește cu `NEXT_PUBLIC_API_URL=https://<PUBLIC_HOST>`.
5. Setează **`APP_BASE_URL=https://<PUBLIC_HOST>`** (cu `https`) pentru redirect-uri Revolut și emailuri.
6. Pornește stack-ul:

```bash
docker compose -f docker-compose.vps.yml --env-file .env.vps up -d --build
```

`--env-file .env.vps` e necesar ca Docker Compose să poată interpola `POSTGRES_PASSWORD` în `DATABASE_URL` pentru servicii.

7. DNS la Hostinger: înregistrare **A** pentru `@` și/sau `www` către IP-ul VPS.

## HTTPS (Let’s Encrypt)

Configurația livrată expune doar **portul 80**. După ce site-ul răspunde pe HTTP:

- rulează Certbot pe host (snap) cu modul **nginx** sau **webroot**, apoi
- extinde `deploy/nginx.vps.conf` cu `listen 443 ssl` și certificatele montate în containerul nginx, **sau**
- pune în față un reverse proxy (ex. Caddy) pe host care termină TLS și proxează către `127.0.0.1:80`.

## Judge

Dacă ai nevoie de rulare cod (probleme / submissions):

```bash
docker compose -f docker-compose.vps.yml --env-file .env.vps --profile judge up -d --build
```

`JUDGE_SECRET` din `.env.vps` trebuie să coincidă cu cel folosit de backend.

## Upload-uri BAC

În containere, PDF-urile elevilor merg într-un **volume Docker** partajat (`bac_uploads`). Variabila **`BAC_SUBMISSIONS_UPLOAD_DIR`** e setată automat în compose la `/data/bac-uploads`. Local, fără Docker, poți seta manual `BAC_SUBMISSIONS_UPLOAD_DIR` în `.env` dacă vrei alt folder.

**Important:** Next.js în producție nu servește fișiere adăugate în `public/` după build. Nginx expune direct `/uploads/bac-submissions/` din același volume (`deploy/nginx.vps.conf`). Dacă PDF-urile dau 404, verifică că serviciul `nginx` are volumul `bac_uploads` montat și repornește stack-ul după actualizarea config-ului.

## Actualizări (deploy nou)

```bash
git pull
docker compose -f docker-compose.vps.yml --env-file .env.vps up -d --build
```

## Backup

- Volume `pg_data` — baza de date.
- Volume `backend_storage` — facturi PDF emise.
- Volume `bac_uploads` — lucrări BAC încărcate.

Folosește `docker volume ls` / export periodic sau backup la nivel de VPS.
