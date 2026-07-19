# FitBlueprint — Privacy & Security

FitBlueprint is **local-first**: all personal data stays on your device. There is no
backend, no analytics, no third-party processors, and no network transmission of your
health data. This document describes the security design and how it maps to the GDPR.

## What data is processed

Profile (age, sex, height, weight, body-fat, goals, medical conditions, injuries,
lifestyle answers), weigh-ins, logged workouts, habit check-offs. All of it is entered
by the user, for the sole purpose of generating and tracking a personalized training and
nutrition plan.

## Security design (data at rest)

Multi-user profiles, each independently encrypted:

- **Key derivation:** the profile passcode is stretched with **PBKDF2-HMAC-SHA256,
  310,000 iterations**, over a random 16-byte salt (OWASP 2023 minimum). The passcode is
  never stored.
- **Encryption:** data is encrypted with **AES-256-GCM**, a fresh random 12-byte IV per
  write, providing confidentiality and tamper-detection (authenticated encryption).
- **Passcode verification:** a fixed token encrypted under the derived key acts as a
  verifier — a wrong passcode fails GCM authentication, so passcodes are never compared
  in plaintext and never persisted.
- **Session:** the derived key lives only in memory for the unlocked tab. Locking or
  closing the tab wipes it; nothing readable remains at rest.
- **Storage:** each profile's ciphertext is stored under `fitblueprint-user-<id>` in the
  browser's localStorage. The account registry holds only non-secret metadata (display
  name, salt, verifier, timestamps).

All primitives are the platform's audited WebCrypto (`crypto.subtle`) — no custom
cryptography. Where WebCrypto is unavailable (e.g. a restricted preview sandbox), the app
runs in a clearly-labelled ephemeral mode with no persistence rather than storing
anything unencrypted.

### Threat model

- **Protects against:** another person casually opening the app, or reading localStorage,
  without the passcode; shoulder-value snooping of stored data.
- **Does not protect against:** malware/keyloggers on the device, a physically
  compromised unlocked device, or a forgotten passcode (data is unrecoverable by design —
  there is no backdoor).

## GDPR alignment

| Principle / Right | How FitBlueprint meets it |
|---|---|
| **Lawful basis (Art. 6)** | Explicit consent, collected at profile creation, withdrawable anytime. |
| **Consent (Art. 7)** | Unbundled opt-in checkbox with a plain-language privacy notice; consent timestamp stored. |
| **Data minimization (Art. 5(1)(c))** | Only data the user enters for coaching; no tracking, device, or location data. |
| **Purpose limitation (Art. 5(1)(b))** | Data is used only to generate and track the plan, on-device. |
| **Right to erasure (Art. 17)** | "Erase account & all data" deletes the ciphertext and registry entry irrecoverably. |
| **Right to portability (Art. 20)** | "Export my data" produces a machine-readable JSON download. |
| **Privacy by design & default (Art. 25)** | Local-first, encrypted-at-rest, no network egress, secure defaults. |
| **Security of processing (Art. 32)** | AES-256-GCM + PBKDF2 (310k) via WebCrypto; key only in memory. |
| **No international transfers (Ch. V)** | Data never leaves the device, so there are no transfers. |

The user is both the data subject and, in practice, the data controller of their own
on-device data. FitBlueprint (the software) acts as a tool, not a processor, because no
operator ever receives the data.

## If this is ever deployed with a backend

A server-backed multi-device version must add, at minimum:

- Server-side password hashing with **Argon2id** (or scrypt/bcrypt), never plain PBKDF2
  alone; rate-limiting and lockout on auth endpoints.
- **TLS 1.2+** for all transport; HSTS.
- **EU/EEA data residency** (or an adequacy decision / SCCs) and a signed **Data
  Processing Agreement** with any hosting provider (they become a processor under Art. 28).
- Encryption at rest on the server; secrets in a managed KMS.
- Audit logging, breach-detection, and a documented **breach-notification** process
  (Art. 33/34, 72-hour rule).
- A Record of Processing Activities (Art. 30) and, given health data (a special category
  under Art. 9), a **Data Protection Impact Assessment** (Art. 35) and an explicit Art. 9
  condition for processing.
- Cookie/consent management and an updated, published privacy policy naming the controller
  and DPO contact.

Health data is a *special category* under Art. 9 — a server deployment raises the
compliance bar substantially versus the current on-device design.
