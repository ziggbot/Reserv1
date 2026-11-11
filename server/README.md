# Fristående FitBlueprint på Render + Neon

Appen kräver inget ChatGPT-konto. Den befintliga PWA:n innehåller planer,
passloggning, vikttrender och vanor. Lokala profiler fortsätter vara krypterade.
Ett separat Neon-molnkonto ger **manuell krypterad säkerhetskopiering och
återställning** mellan enheter. Detta är inte automatisk synkronisering.

## Kom igång lokalt

```sh
npm ci --include=dev
npm run build
# Ange servervariablerna säkert, enligt .env.example.
# Node läser inte en .env automatiskt i npm start.
node --env-file=.env server/index.mjs
```

Öppna `http://localhost:3000`. Utan komplett molnkonfiguration startar servern
med lokal träning och döljer molnkontot. Utveckling med bara Vite saknar molnservern;
den lokala träningsappen fungerar ändå. Servern behöver Node 22 eller senare.

## Infrastruktur

Ett separat Neon-projekt skapades i Frankfurt:

- Projekt: `red-mode-58750157` (FitBlueprint).
- Produktion: `br-bold-sky-bazmno61`.
- Utveckling: `br-damp-cherry-bagj3rzi`.
- Databas: `fitblueprint`; Managed Better Auth aktiverat på båda grenarna.
- `schema.sql` har applicerats och kontrollerats på utvecklingsgrenen före produktion.
- Fast compute 0,25 CU med planens automatiska viloläge; sex timmars historik.

De andra Neon-projekten har inte ändrats. Inga lösenord eller anslutningssträngar
finns i källkoden. Nya schemaversioner ska testas på en egen gren före produktion.

## Render-publicering

Avsedd tjänst: en Node-webbtjänst i Frankfurt på den minsta planen `free`.
Ingen Render-databas, disk eller AI-tjänst behövs. Molnkonfigurationens källa är
tjänstens miljövariabler via Render, inte en parallell Blueprint.

- Repo: `https://github.com/ziggbot/Reserv1`.
- Gren: `codex/standalone-render-neon`.
- Build: `npm ci --include=dev && npm run build`.
- Start: `npm start`.
- `NODE_ENV=production`, `NODE_VERSION=22`.
- `DATABASE_URL`: serverhemlighet, poolad anslutning till rätt Neon-produktionsgren.
- `NEON_AUTH_BASE_URL`: den faktiska Managed Auth-adressen från samma gren.
- Origin: Render tillhandahåller `RENDER_EXTERNAL_URL`; `APP_ORIGIN` behövs bara
  för lokal körning eller för en uttrycklig domänändring.
- HTTP health endpoint: `/health`. Servern lyssnar på `0.0.0.0:$PORT`.

Skapa inte en andra tjänst om en första registrering redan pågår. När URL:en finns,
lägg till dess exakta origin som trusted domain i Neon Auth på produktionsgrenen.
Kontrollera att Render-deployen är `live`, att `/health` och startsidan svarar,
och att skyddade API-anrop utan inloggning nekas. Testa sedan verklig registrering,
session efter omladdning, utloggning, sparande och återställning med syntetiska data.

Publicerad 2026-11-11: **https://fitblueprint.onrender.com**.
Render-tjänst: `srv-dbqcvk5g1s2s73dvo86g` i användarens bekräftade arbetsyta
`tea-d8c2dth9rddc73f6jo80`. Deploy `dep-dbqddd49v7es73dfov90` är `live`
på applikationscommit `30b8842ad0ee6a0065a3d732dbd914511ebda021`.
`/health` svarar 200 och `/api/config` returnerar `cloudEnabled: true`.

Efter ägarens uttryckliga godkännande har `DATABASE_URL` sparats som serverhemlighet
i den befintliga Render-tjänsten. Värdet finns inte i källkoden eller webbläsaren.
Den publika appadressen är tillagd i Neons trusted origins.

Verifierat mot den riktiga publicerade appen 2026-11-11: ett syntetiskt molnkonto
skapades, en lokal träningsplan sparades krypterat till Neon och återställdes i en
ny webbläsarsession med den ursprungliga profilkoden. Den återställda profilen
behöll sina uppgifter. Provkopian raderades därefter via appens bekräftelseflöde.
Anrop till molnkopior utan inloggning returnerar 401. Det rättade tokenflödet
använder Managed Auth-SDK:ns `getSession().data.session.token`.

Molnkopior är manuella: välj Spara upplåst profil till Neon i Inställningar.
På en annan enhet loggar du in på samma molnkonto, hämtar kopian och anger
den ursprungliga profilkoden. Behåll både molnlösenordet och profilkoden.

## Säkerhet och dataflöde

Neon Auth proxas på samma origin via `/api/auth` för att undvika beroende av
tredjepartscookies i mobil Safari. Upstream-adressen är serverkonfiguration,
inte användarinput. Proxyvägarna är begränsade och skrivningar kräver rätt Origin.
Moln-API:t kräver en EdDSA-signerad Neon JWT med rätt issuer, audience, expiry och
subject. Varje SQL-anrop begränsas av verifierat `user_id`; klienten väljer aldrig
sin ägare. Användaruppgifter får inte föras in i SQL-strängar.

Säkerhetskopior krypteras i webbläsaren med profilkoden. Servern får krypterad data,
salt, verifierare och metadata, aldrig själva profilkoden eller nyckeln. AI-nycklar
tas bort före krypteringen. Spara-knappen tar en ögonblicksbild; nyare lokala
ändringar kräver att du sparar igen. Revisioner förhindrar tysta konflikter.
Återställning kräver den ursprungliga profilkoden och ett uttryckligt ersättningsval.

Lokala profiler och molnkopior raderas separat. Molnkontots identitet raderas
tills vidare via administration i Neon. Plattformarnas loggar och återställnings-
historik har egna livscykler. `/cloud-privacy.html` beskriver den tekniska
databehandlingen; komplett utgivarinformation och villkor behövs för bred lansering.
Neons delade e-postleverans används för att komma igång; konfigurera egen SMTP
före bred produktion. Gratis Render kan gå i vila och ge långsam första laddning.

## Kontroller

```sh
npm test
npm run test:chatgpt
npm run test:server
npm run build
```

Serverproven kontrollerar autentisering, ägarisolering, validering, konflikter,
no-store och proxygränser. Databashemligheter ska aldrig loggas. API och Auth
utesluts ur service worker-cachen.
