# FitBlueprint i ChatGPT

Server och mobilanpassad MCP App-vy ovanpå Reserv1:s befintliga träningsmotor.
Detta är källkod för en integration, inte en publicerad eller installerad app.

## Funktioner

- `open_fitblueprint`: öppnar appen från chatt, global navigering eller tråd.
- `create_fitness_plan`: träningsprogram, kostuppskattningar, vanor och färdplan.
- `analyze_weight_trend`: analyserar inskickade vägningar utan att lagra dem.
- Interaktiv vy med flikarna Träning, Kost, Vanor och Färdplan, mörkt tema och safe-area-stöd.

ChatGPT sköter samtalet; användaren behöver ingen separat modellnyckel.
Den befintliga webbappen behåller sin egen lagring och sina coachalternativ.
Den nya integrationen läser inte webbappens lokala konton eller historik och
återanvänder inte ägarens förifyllda träningsvikter. Passloggning och synkronisering
mellan mobil och webb ingår ännu inte i ChatGPT-integrationen.

## Bygg och testa

```sh
npm ci --include=dev
npm test
npm run test:chatgpt
npm run build
npm run build:chatgpt
```

Webbappen byggs i `dist/`. MCP-servern byggs separat i `dist/server/index.js`
som en Cloudflare Worker ES-modul utan externa beroenden. Bygg webbappen först
om båda utdata ska behållas; dess Vite-build tömmer annars `dist/`.

## Hosting och anslutning

Den avsedda vägen är Sites med autentiserad ingress och dess kanoniska plugin.
Sites-hjälparna finns inte installerade i denna arbetsyta, så registrering,
källsynkronisering, publicering och riktig ChatGPT-anslutning är inte genomförda.
Byt inte till en annan host utan att lösa autentiseringen.

1. Öppna projektet i en miljö med Sites utvecklingshjälpare.
2. Registrera en privat Site en gång. Spara dess returnerade `project_id` i
   `.openai/hosting.json` och lägg till deklarationerna från `hosting.template.json`.
   Mallen innehåller avsiktligt inget påhittat projekt-ID och är inte deploymanifest.
3. Paketera den byggda Workern med Sites källsynkronisering och publicera privat.
4. Återanvänd pluginen som Sites skapar. Verifiera verktygen och appvyn i ChatGPT.
5. Gör granskning och publik katalogpublicering enligt `PUBLICATION.md`.

`POST /mcp` stöder `server/discover`, äldre `initialize`, `tools/list`,
`tools/call`, `resources/list` och `resources/read`. `GET /health` ger driftstatus.
Servern kräver `oai-authenticated-user-id` från Sites. Headern är en förtroendegräns,
inte en fristående autentiseringsmekanism. Exponera inte Workern direkt på internet:
en klient kan själv sätta headern om en betrodd ingress inte verifierar den.

## Data och gränser

Serverkoden har ingen databas, inga cookies, ingen loggning av anrop och inga
externa API-anrop. Uppgifter skickas från ChatGPT till hosten för beräkning och
returneras till ChatGPT. ChatGPT och hostingplattformen kan ha egen loggning
och lagring; detta måste täckas i en faktisk publicerad integritetspolicy.
Den befintliga `PRIVACY.md` beskriver webbappen och räcker inte som policy för
den nya integrationen.

Planer stöds för vuxna 18–100 år och 2–6 träningsdagar. Uppgifter valideras
på servern. Medicinska tillstånd och graviditet ger hänvisning till vården
i stället för automatiska individmål. Befintliga motorresultat är uppskattningar;
de behöver produkt- och medicinsk kvalitetsgranskning innan bred lansering.
Schema och pass begränsas till användarens dagbudget; motorns engelska innehåll
visas tills vidare i den svenska appvyn.
