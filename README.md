# Thie B2B Wholesale Portal

> **B2B-Großhandelsportal für refurbished IT-Geräte** (iPhones, Samsung, Tablets) der **Thie GmbH**.
> Kunden stellen Bestellanfragen, die vom Admin manuell freigegeben werden. Inventar wird atomar reserviert.

- **Live (Produktion):** https://wholesale.thie-eco-shop.de
- **Lovable Preview:** https://thie-b2b.lovable.app
- **Lovable Project:** https://lovable.dev/projects/ffbeba74-f9da-48cd-85c3-b2685f6a3fb2

---

## 📑 Inhaltsverzeichnis

1. [Projektübersicht](#-projektübersicht)
2. [Tech-Stack](#-tech-stack)
3. [Lokales Setup](#-lokales-setup)
4. [Projektstruktur](#-projektstruktur)
5. [Features](#-features)
6. [Datenbank-Schema](#-datenbank-schema)
7. [Edge Functions](#-edge-functions)
8. [Authentifizierung & Rollen](#-authentifizierung--rollen)
9. [Inventar- & Reservierungslogik](#-inventar--reservierungslogik)
10. [Internationalisierung (i18n)](#-internationalisierung-i18n)
11. [Design System](#-design-system)
12. [Deployment & GitHub-Sync](#-deployment--github-sync)
13. [Umgebungsvariablen](#-umgebungsvariablen)
14. [Wartung & Troubleshooting](#-wartung--troubleshooting)

---

## 🎯 Projektübersicht

Das Portal ist ein **anfragebasierter B2B-Shop**: Kunden legen Geräte in den Warenkorb und senden eine **Anfrage** ab. Bestellungen werden nicht direkt bezahlt, sondern vom Admin geprüft, freigegeben oder abgelehnt. Reservierte Geräte werden automatisch nach 10 Minuten freigegeben, falls die Anfrage nicht abgesendet wird.

**Hauptakteure:**
- **Kunde (`user`)** — Registriert sich, vervollständigt Firmenprofil, stellt Anfragen.
- **Admin (`admin`)** — Verwaltet Produkte, Kunden, Bestellungen und weitere Admins.

---

## 🛠 Tech-Stack

| Bereich | Technologie |
|---|---|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Styling** | Tailwind CSS v3, shadcn/ui, Radix UI |
| **State** | TanStack Query, React Context |
| **Routing** | React Router v6 |
| **Backend** | Lovable Cloud (Supabase: Postgres, Auth, Storage, Edge Functions) |
| **E-Mails** | Resend (via Edge Functions) |
| **Datei-Verarbeitung** | XLSX (CSV/Excel-Import von Produktlisten) |
| **Icons** | lucide-react |
| **Forms** | react-hook-form + zod |
| **i18n** | Eigenes Translations-Objekt (DE/EN/FR/NL) |

---

## 💻 Lokales Setup

**Voraussetzungen:** Node.js ≥ 18, npm oder bun.

```bash
# 1. Repository klonen
git clone <REPO_URL>
cd <REPO_NAME>

# 2. Dependencies installieren
npm install

# 3. Entwicklungsserver starten
npm run dev
```

Die App läuft dann unter `http://localhost:8080`. Die `.env`-Datei mit den Supabase-Credentials wird automatisch von Lovable Cloud verwaltet — **nicht manuell editieren**.

**Verfügbare Skripte:**
- `npm run dev` — Dev-Server mit Hot-Reload
- `npm run build` — Produktions-Build (`dist/`)
- `npm run preview` — Build lokal testen
- `npm run lint` — ESLint

---

## 📁 Projektstruktur

```
├── public/                     # Statische Assets (Logo, Favicon, robots.txt)
├── src/
│   ├── components/
│   │   ├── admin/              # Admin-Komponenten (CustomersTab, ProductsTable, BulkEditModal, ...)
│   │   ├── icons/              # AppleLogo, SamsungLogo
│   │   ├── layout/             # Header, Footer, AppLayout, ReservationTimer
│   │   ├── products/           # ProductCard, ProductList, CartBar, FilterModal, SubmitModal
│   │   ├── requests/           # EditRequestModal, RequestActionModal
│   │   ├── ui/                 # shadcn/ui Komponenten
│   │   ├── AdminRoute.tsx      # Guard für Admin-Routen
│   │   └── ProtectedRoute.tsx  # Guard für eingeloggte Nutzer
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Session, User, Rolle, Profil
│   │   ├── CartContext.tsx     # Warenkorb mit atomaren Reservierungen
│   │   └── LanguageContext.tsx # i18n DE/EN/FR/NL
│   ├── hooks/                  # useProducts, useRequests, use-mobile
│   ├── i18n/translations.ts    # Alle Übersetzungs-Strings
│   ├── integrations/supabase/  # AUTOGENERIERT — nicht editieren
│   ├── pages/                  # Login, Register, Dashboard, Profile, Admin, Customers, Orders, ...
│   ├── App.tsx                 # Routing
│   └── index.css               # Design Tokens (HSL)
├── supabase/
│   ├── config.toml             # Edge-Function-Konfiguration
│   ├── functions/              # Edge Functions (Deno)
│   └── migrations/             # SQL-Migrationen (READ-ONLY)
└── tailwind.config.ts          # Tailwind-Theme
```

---

## ✨ Features

### Kundenseite
- **Produktkatalog** mit Filtern (Hersteller, Modell, Grade, Speicher, Farbe), Suche und Grid-/List-View.
- **Markenfilter-Kacheln** (Apple/Samsung) und dynamische Grade-Quick-Filter.
- **Warenkorb (CartBar)** mit Mengensteuerung, Versandvorschau, 10-Min-Reservierung.
- **Anfrageprozess**: Express-Versand-Option, Versandkostenberechnung.
- **Profilverwaltung**: Firmen-, Rechnungs- und Lieferadresse, Kontaktpersonen, Logo-Upload, Geschäftsdokumente.
- **Anfragenhistorie** mit Bearbeitung von Pending-Anfragen.

### Admin-Bereich
- **Dashboard** mit Live-Statistiken und großen Action-Tiles.
- **Produktverwaltung**: CSV-/Excel-Import (flexibles Grading, EU-Preisparsing), Bulk-Edit (Preis/Bestand), Bulk-Delete.
- **Kundenverwaltung** (`/kunden`): vollständige Kundeninfos einsehbar/bearbeitbar inkl. hochgeladener Dokumente.
- **Bestellverwaltung** (`/orders`): Anfragen freigeben/ablehnen, Excel-/CSV-Export, Bearbeitung vor Freigabe.
- **Admin-Verwaltung**: weitere Admins anlegen.
- **E-Mail-Benachrichtigungen** automatisch via Edge Functions + Resend.

### Versandregeln
- **Kostenloser Versand** ab 50 Einheiten, sonst **20 € pauschal**.
- **Express-Option**: 50 € + 1 % Versicherung des Warenwerts.

---

## 🗄 Datenbank-Schema

**Tabellen** (alle in `public`, mit RLS-Policies):

| Tabelle | Zweck |
|---|---|
| `profiles` | Firmen-, Rechnungs- & Lieferdaten pro User. `profile_completed` steuert Checkout-Berechtigung. |
| `user_roles` | RBAC: `admin` oder `user` (separate Tabelle gegen Privilege-Escalation). |
| `products` | Geräte mit `manufacturer`, `name`, `storage`, `color`, `grade`, `battery_health`, `price_per_unit`, `available_units`. |
| `cart_reservations` | Aktive 10-Min-Reservierungen pro User/Produkt. |
| `requests` | Bestellanfragen mit Status `pending` / `approved` / `rejected`. |
| `request_items` | Positionen einer Anfrage. |
| `contact_persons` | Zusätzliche Ansprechpartner pro Kunde. |
| `business_documents` | Hochgeladene Geschäftsdokumente (Gewerbeschein etc.). |

**Wichtige RPCs (SECURITY DEFINER):**
- `has_role(_user_id, _role)` — Rollencheck ohne RLS-Rekursion.
- `reserve_product(p_product_id, p_quantity)` — Atomare Reservierung.
- `release_product_units(p_product_id, p_quantity)` — Bestand freigeben.
- `release_user_reservations()` — Alle Reservierungen des aktuellen Users löschen.
- `reset_reservation_timer()` — Timer zurücksetzen.
- `cleanup_expired_reservations()` — Abgelaufene Reservierungen aufräumen.
- `create_request_atomic(p_items, p_express_shipping, p_shipping_cost)` — Anfrage atomar anlegen.
- `edit_request_items(p_request_id, p_items)` — Bestehende Anfrage bearbeiten.

**Enums:**
- `app_role`: `admin` | `user`
- `request_status`: `pending` | `approved` | `rejected`

> Schema-Änderungen erfolgen ausschließlich über neue Migrationen in `supabase/migrations/`.
> Die Datei `src/integrations/supabase/types.ts` wird automatisch generiert.

---

## ⚡ Edge Functions

Alle Edge Functions liegen unter `supabase/functions/` und werden bei Push automatisch deployt.

| Function | JWT | Zweck |
|---|---|---|
| `create-customer` | ❌ | Admin legt neuen Kunden inkl. Auth-User an. |
| `notify-new-products` | ❌ | Mail an alle Kunden bei neuem Produkt-Upload. |
| `notify-new-request` | ❌ | Admin-Mail bei neuer Anfrage. |
| `notify-request-confirmation` | ❌ | Bestätigungsmail an Kunde. |
| `notify-request-status` | ❌ | Mail an Kunde bei Approval/Rejection. |
| `notify-order-approved` | ❌ | Bestätigungsmail nach Freigabe. |
| `send-order-message` | ✅ | Admin-Nachricht zu einer Bestellung an Kunde. |

**Benötigte Secrets** (in Lovable Cloud → Edge Functions → Secrets):
- `RESEND_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (automatisch)

---

## 🔐 Authentifizierung & Rollen

- **Standard E-Mail/Passwort-Login** (Supabase Auth) — keine Anonymous-Sign-Ups.
- **Google OAuth** verfügbar.
- **2-Step-Registrierung**: Account anlegen → Profil vervollständigen (Firma, Adresse, Kontakt).
- **`profile_completed`-Flag** blockiert Checkout, bis alle Pflichtfelder ausgefüllt sind.
- **RBAC** über separate `user_roles`-Tabelle. Rollencheck ausschließlich serverseitig via `has_role()`.

**Route-Guards:**
- `ProtectedRoute` → eingeloggter User
- `AdminRoute` → Rolle `admin`

---

## 📦 Inventar- & Reservierungslogik

1. Klick auf „In den Warenkorb" → `reserve_product()` reduziert `available_units` atomar und legt eine `cart_reservation` mit `expires_at = now() + 10 min` an.
2. Beim Entfernen oder bei Ablauf wird der Bestand via `release_product_units()` zurückgegeben.
3. **Frontend-Mutexes** verhindern parallele Reservierungs-Calls für dasselbe Produkt.
4. Produkte mit `available_units <= 0` werden im Katalog ausgeblendet.
5. **Timer im Header** (`ReservationTimer`) zeigt verbleibende Zeit, „Reset" verlängert um 10 Min.
6. Beim Absenden der Anfrage werden Reservierungen in `request_items` umgewandelt (`create_request_atomic`).

---

## 🌍 Internationalisierung (i18n)

- Sprachen: **DE (Default), EN, FR, NL**.
- Auto-Detect über Browser-Locale beim ersten Besuch.
- Manueller Wechsel via `LanguageSwitcher` im Header.
- Alle Strings zentral in `src/i18n/translations.ts`.
- Zugriff über `useLanguage()` → `t.<bereich>.<key>`.

---

## 🎨 Design System

- **Primärfarbe:** Dunkelgrün `#1B4332`
- **Akzent:** Mintgrün `#009C77`
- **Hintergrund:** Helles Mint
- **Stil:** Minimal B2B, abgerundete Karten, mobile-first.
- **Tokens** in `src/index.css` (alle Farben als HSL) und `tailwind.config.ts`.
- **Komponenten:** shadcn/ui mit `cva`-Varianten.

> **Regel:** Nie direkte Farbklassen wie `bg-white` oder `text-black` in Komponenten — immer semantische Tokens (`bg-background`, `text-foreground`, `bg-primary`, ...).

**Branding:**
- Nicht-Admins sehen das hochgeladene Firmenlogo statt Initialen.
- Logo & Favicon in `public/`.

---

## 🚀 Deployment & GitHub-Sync

### Lovable ↔ GitHub
- **Bidirektionale Sync**: Änderungen in Lovable werden automatisch nach GitHub gepusht — und Pushes nach GitHub erscheinen sofort in Lovable.
- Verbindung über **Lovable → Connectors → GitHub**.
- Edge Functions werden bei jedem Commit **automatisch deployt**.

### Veröffentlichen
- In Lovable oben rechts auf **Publish** klicken.
- Custom Domain `wholesale.thie-eco-shop.de` ist über Lovable → Project Settings → Domains verbunden.

### Lokal entwickeln & pushen
```bash
git checkout -b feature/mein-feature
# ... ändern ...
git commit -am "feat: ..."
git push origin feature/mein-feature
# PR auf main → Merge → automatisch live
```

---

## 🔑 Umgebungsvariablen

`.env` wird **automatisch** von Lovable Cloud generiert — nicht manuell anpassen:

| Variable | Zweck |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Projekt-URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public Anon Key |
| `VITE_SUPABASE_PROJECT_ID` | Projekt-ID |

**Edge-Function-Secrets** werden in Lovable Cloud → Edge Functions verwaltet (z. B. `RESEND_API_KEY`).

---

## 🛟 Wartung & Troubleshooting

**Produkte importieren (Admin):**
CSV/Excel mit Spalten `name`, `manufacturer`, `storage`, `color`, `grade`, `battery_health`, `price_per_unit`, `available_units` über Admin-Dashboard hochladen. EU-Preisformat (`1.234,56`) wird automatisch geparst.

**Häufige Probleme:**
| Problem | Lösung |
|---|---|
| Kunde kann nicht bestellen | `profile_completed` prüfen — Profil muss komplett sein. |
| Produkt im Shop nicht sichtbar | `available_units > 0`? Eventuell Bestand erhöhen oder Reservierungen aufräumen. |
| Reservierung blockiert Bestand | RPC `cleanup_expired_reservations()` läuft regelmäßig; bei Bedarf manuell triggern. |
| Edge Function gibt 401 | Bei `verify_jwt = true` Auth-Header prüfen; sonst `config.toml` prüfen. |
| E-Mails kommen nicht an | `RESEND_API_KEY` gesetzt? Edge-Function-Logs in Lovable Cloud prüfen. |
| Mehr als 1000 Datensätze fehlen | Supabase-Default-Limit — Pagination oder `.range()` nutzen. |

**Wichtige Konventionen:**
- ❌ Niemals `src/integrations/supabase/types.ts` oder `client.ts` editieren — autogeneriert.
- ❌ Niemals Migrationen in `supabase/migrations/` ändern — nur neue erstellen.
- ✅ DB-Änderungen ausschließlich über neue, timestamped Migrationen.
- ✅ Rollen niemals auf `profiles` speichern — immer `user_roles`.
- ✅ Alle Farben als HSL in `index.css` definieren.

---

## 📞 Kontakt

**Thie GmbH**
Navarrastraße 15, 33106 Paderborn
Tel.: 05251 5438 006 · E-Mail: kontakt@thie-eco.de
HRB 14169 (AG Paderborn) · USt.-ID: DE326347764

---

_Built with [Lovable](https://lovable.dev)._
