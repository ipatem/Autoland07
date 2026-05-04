# Autoland 07 — Product Requirements

## Business
- **Name**: Autoland 07 — Magazin piese auto import
- **Owner / Sole employee**: Mihai Ipate
- **Address**: Bulevardul Nicolae Titulescu 78, Buzău, România
- **Default hours**: Lu–Vi 08:30–17:00 · Sâ 09:00–13:00 · Du Închis

## Goal
Help customers find the right car part fast by sending Mihai a structured inquiry (VIN / model / problem). Mihai can reply, mark resolved, and request a short review that appears on the site as a sticky-note wall — turning every successful job into social proof.

## Personas
- **Client** — needs a part, scans QR / opens link, fills form in <30s.
- **Mihai (admin)** — single employee; checks inquiries, toggles store status (În magazin / Pauză / Plecat), and sends review links.

## Key flows
1. **Public home** — Hero, live status badge, contact strip (phone/email/address/program), inquiry form (Nume*, Telefon/Email*, VIN, Model/An, Problemă*), post-it review wall.
2. **Admin login** — `mihai@autoland07.ro` / `Autoland2026!` (JWT, 7-day token).
3. **Admin dashboard** — store status toggle, inquiries list (NOU badge), Mark Rezolvat → generates review token + share modal (WhatsApp/SMS), Settings tab (edit contact + program + status message).
4. **Review submission** — `/review/{token}` validates token (404 invalid / 409 already used), star rating + message, posts back as a colorful post-it (yellow / pink / cyan / green) on home.

## Tech
- **Backend**: FastAPI + Motor + bcrypt + PyJWT. Collections: `users`, `settings` (singleton _id="main"), `inquiries`, `reviews`. All routes under `/api`.
- **Frontend**: Expo Router (file-based) — `/`, `/admin/login`, `/admin/dashboard`, `/review/[token]`. Fonts: Barlow Condensed (headings), IBM Plex Sans (body), Caveat (post-its). AsyncStorage for token.
- **Theme**: Dark industrial (#0A0A0A / #FF3B30 brand) with chaotic colorful post-it wall as signature element.

## Smart business enhancement
**Auto-generated post-it review wall** — every resolved inquiry triggers a one-click WhatsApp/SMS review request. Reviews instantly appear on the public site as physically-stuck post-it notes (4 colors, randomised rotations) that double as social proof and a delightful brand moment. Conversion booster: the same surface that captures leads (inquiry form) is reinforced visually by trust signals from past customers — no extra effort from Mihai beyond the existing "Mark Rezolvat" tap.

## Open ideas (next)
- Email/SMS push notification to Mihai when a new inquiry lands.
- Photo upload on inquiry form.
- Inquiry → WhatsApp deep-link reply.
- Public store map embed.
