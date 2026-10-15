# FitBlueprint MCP server

The web app's engine and data, exposed to ChatGPT and Claude through the Model Context
Protocol. Same Supabase row, same validation, same program rules — the chat becomes the coach
and the web app stays the logger.

## Run

```bash
cd server
npm install
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=eyJ… PUBLIC_URL=https://your-host npm start
```

Environment:

| var | required | meaning |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | yes | same project as the web app |
| `PUBLIC_URL` | in production | the server's own https URL (used in OAuth metadata) |
| `APP_URL` | no | web app URL shown in "open in the logger" links |
| `OAUTH_ISSUER`, `OAUTH_AUTHORIZE_URL`, `OAUTH_TOKEN_URL`, `OAUTH_REGISTRATION_URL` | no | override the authorization server advertised to clients; default is Supabase Auth |

On Render: New → Web Service, root directory `server`, build `npm install`, start `npm start`.

## Auth

Every request to `/mcp` must carry `Authorization: Bearer <Supabase access token>`. The token is
verified with Supabase (`auth.getUser`) and then used as the user for every database call, so
row-level security applies exactly as in the browser.

For the OAuth flow that ChatGPT and Claude run, the server publishes
`/.well-known/oauth-protected-resource/mcp` pointing at the issuer above. Enable the OAuth 2.1
server in your Supabase project (Authentication → OAuth Server) so clients can register and obtain
tokens; the discovery URLs can be overridden with the `OAUTH_*` variables if your project exposes
them elsewhere.

Quickest test without OAuth: sign in to the web app, copy the session's access token from the
browser (localStorage key `sb-<ref>-auth-token` → `access_token`) and use it as the Bearer token in
an MCP client that supports custom headers. Tokens expire after an hour.

## Tools

| tool | writes | what |
|---|---|---|
| `get_profile` | – | goal, level, equipment, injuries, week budget, targets, active program |
| `get_training_summary` | – | the grounding digest: recent sessions, PRs, feedback, trends, weight, streaks |
| `get_next_session` | – | next session in the rotation with exercises, warm-up, checklist, logger link |
| `get_program` | – | full program, rules, AI change log, custom exercises |
| `get_coach_context` | – | all of the above in one call |
| `log_workout` | ✓ | strength session with sets, optional feedback; advances the rotation |
| `log_activity` | ✓ | cardio / endurance / stretch minutes |
| `log_weigh_in` | ✓ | body weight for a day |
| `preview_program_update` | – | validate a proposed program and return the diff |
| `apply_program_update` | ✓ | save it as the AI-coach program and make it active (logged with rationale) |

Writes merge with the current row (union of collections), so a concurrent push from the web app is
never lost; the web app pulls the row on focus and every minute.
