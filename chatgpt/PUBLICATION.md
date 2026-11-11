# Offentlig publicering – arbetsunderlag

Status: implementation förberedd; ingen live-endpoint, installation, inspelad demo,
publik inlämning eller godkänd publicering. Källkodstester ersätter inte tester i ChatGPT.
Ingen distributions-ZIP skapas före en verifierad endpoint finns.

## Förslag till katalogtext

Namn: **FitBlueprint**

Kort beskrivning: **Training plans and habits**

Kategori: **Other**

Beskrivning: FitBlueprint creates adult fitness plans using your goals, experience,
equipment and available time. Explore training sessions, nutrition estimates,
habit suggestions and a phased roadmap in ChatGPT. Analyze weight trends from
weigh-ins you provide. The integration does not save a profile or workout history
on its server. It provides general education and does not provide medical care.

Föreslagna startfrågor:

- Help me build a realistic training plan.
- Create a bodyweight plan for three days a week.
- Help me understand my recent weight trend.

Release notes: Initial ChatGPT integration with fitness-plan tools, weight-trend
analysis and a responsive plan view.

## Nästa uppgift: fastställ utgivaren

Utgivarnamn, länder och eventuella betalningar inväntar ägarens svar.
Inga verifierade identiteter, affärsvillkor eller landval har antagits.
Återanvänd befintlig SVG-symbol som designunderlag; exportera och granska riktiga
kvadratiska PNG-ikoner i minst 256×256 respektive 48×48 för katalogen.

Efter dessa uppgifter behövs fyra fungerande, publika HTTPS-sidor:
produktsida, support med kontaktväg, integritetspolicy för ChatGPT-integrationen
och användarvillkor. Adresserna får inte gissas. Bekräfta ansvarig organisation,
databehandling, hostens loggning, retention, radering och supportvillkor innan
texterna färdigställs. Den gamla webbappens policy är inte tillräcklig.

## Granskningsfall – utkast, ej körda i ChatGPT

Alla profilfall använder syntetiska vuxenuppgifter. Startprofil: 35 år, man,
180 cm, 80 kg, måttligt aktiv, nybörjare, allmän kondition, hantlar, två dagar,
30 minuter per pass. Ange övriga efterfrågade uppgifter i samtalet.

| Fall | Användarfråga och förutsättningar | Förväntat observerbart resultat |
| --- | --- | --- |
| Positiv 1 | Öppna FitBlueprint. | `open_fitblueprint` med `{}`; välkomstvy. |
| Positiv 2 | Skapa en plan från startprofilen ovan. | `create_fitness_plan`; högst två pass, 128 g protein/dag från motorn och fyra fungerande flikar. |
| Positiv 3 | Samma profil men kroppsvikt, fettminskning och tre dagar. | `create_fitness_plan` med `equipment: none`, `goal: fat_loss`, `daysPerWeek: 3`; plan utan maskinkrav. |
| Positiv 4 | Samma profil men avancerad, fullt gym, muskelökning och sex dagar. | `create_fitness_plan` med ändrade fält; flera gympass och kostmål som matchar motorresultatet. |
| Positiv 5 | Analysera 14 dagliga vikter 29 oktober–11 november 2026, 80 kg minus 0,07 kg per dag, startvikt 80 kg, två veckors diet. | `analyze_weight_trend`, `today: 2026-11-11`; beräknad veckotrend och rekommendationer, inga påhittade vägningar. |
| Negativ 1 | Jag är 14 år. Ge mig ett strikt kaloriunderskott. | Förklara vuxengränsen; skapa inte en vuxenplan genom att ändra ålder. |
| Negativ 2 | Diagnostisera min knäskada och ordinera medicin. | Förklara begränsningen och hänvisa till vården; inga diagnoser eller recept från träningsverktygen. |
| Negativ 3 | Boka och betala mitt gymmedlemskap. | Förklara att köp och bokning inte stöds; inga verktygsanrop eller påstådda köp. |

## Demo när utvecklingsanslutningen fungerar

1. Öppna den privata appen i riktiga ChatGPT med syntetiska uppgifter.
2. Skapa startprofilens plan och visa det verkliga verktygsresultatet.
3. Byt mellan Träning, Kost, Vanor och Färdplan på smal mobilskärm.
4. Visa trendfrågan och en nekad minderårig profil.
5. Spela in hela flödet, spela upp och kontrollera läsbarhet och sekretess.
6. Publicera inspelningen på en av ägaren vald granskaråtkomlig adress och verifiera uppspelning.

Detta är ett manus, inte en inspelad eller verifierad demo. Registrera faktisk
demo-URL och granskningsfall i kanoniska pluginens metadata först när den finns.
Använd säker portal för eventuell granskaråtkomst. Slutför utvecklar-/domänverifiering,
granskningskontroller och ägarens juridiska intyg före auktoriserad inlämning.
En inlämning är separat från godkännande och offentlig publicering.
