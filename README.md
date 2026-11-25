# Koluva Repair

Koluva Repair is a Windows desktop app for repair shops. It manages temporary customer details, work orders, dated progress, corrections, estimates, parts, evidence and printable intake/work sheets for phones, computers, consoles and other repairable equipment.

## Version 1.0.2

- Improves startup IPC compatibility and shows the local error detail on the recovery screen. Diagnostics stay on the device.

## Version 1.0.1

- Fixes secure local IPC path validation on Windows and adds a safe startup retry screen. Local records are not deleted by a startup failure.

## Version 1.0.0

- Works locally without an account or internet connection on the Free plan.
- Stores workshop records and attachments in the current Windows user profile; Koluva does not receive those records.
- Supports Spanish, English, French and Portuguese, Windows/light/dark themes, keyboard navigation, the Koluva opening animation and reduced-motion preferences.
- Exports portable backups with attachments. Repair Pro Plus can create and import password-encrypted backups.
- Checks for updates by default, with an opt-out in Settings. Updates are installed only after the user chooses to download; the app verifies the signed ECDSA manifest, exact release URL, size and SHA-256 before running the installer.
- Optional paid-plan activation sends only the license code and a random installation identifier after explicit consent. It does not upload customer names, contacts, work orders, photographs or attachments.

## Plans

- **Free:** 20 active work orders and 40 parts references.
- **Repair Pro:** 100 active work orders and 500 parts references.
- **Repair Pro Plus:** no practical order/parts cap and password-encrypted backups.

Plans are monthly and renewed manually with Koluva; there is no automatic payment. A signed license is bound to one PC and is valid offline for up to seven days after its last online check. When it expires or cannot be checked after the grace period, the app uses Free limits. Existing records remain visible and exportable. Manage subscriptions in the existing Koluva Admin panel; do not publish its license codes.

## Install and update

Download the versioned Windows x64 installer from the Koluva product listing or GitHub release. The per-user installer allows a different install folder and creates Start Menu and desktop shortcuts. Updates are checked at launch and every six hours while enabled; install is always user initiated and preserves app data.

Windows SmartScreen may show an unknown-publisher prompt because this build does not have paid Authenticode signing. The installer is still checked by the signed update channel, but SmartScreen publisher identity is a separate Windows certificate service.

## Build and test

Use Node.js 24.x and npm 11. In PowerShell from the repository root:

```powershell
npm ci
npm test
npm run dist:win
```

The NSIS installer is written to `release/`. `npm start` launches the local development build. See [`docs/VALIDACION.md`](docs/VALIDACION.md) for proof completed and checks still reserved for a real Windows install. The installer must not be tested over an in-use copy without first backing up the user's data.

## Repository and publishing

`release.config.json` pins the public repository and stable channel. Keep the ECDSA update-signing key at `D:\KoluvaVault\06 Seguridad\Koluva Repair\signing\repair-update-private.pem` and the Ed25519 license-signing key at `D:\KoluvaVault\06 Seguridad\Koluva Repair\signing\repair-license-private.pem`. Both are outside Git in a vault folder with restricted Windows permissions. Only the public license key is bundled as `electron/license-public.key`; never commit private keys, tokens, license codes or customer data.

The existing Admin panel is extended with a Repair subscriptions section. Applying the D1 migration and deploying the API Worker are separate steps from publishing the static website. Follow the deployment handoff in `docs/SEGURIDAD.md` and the Koluva apps update/publishing workflow. No new web page is added for Repair.

## Documentation

- [`docs/listing.md`](docs/listing.md): title, summary, description and license in four languages.
- [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md): data flows, trust boundaries and service setup.
- [`docs/COMPETENCIA.md`](docs/COMPETENCIA.md): product decisions and scope.
- [`docs/VALIDACION.md`](docs/VALIDACION.md): completed checks and limits of this release.
- [`CHANGELOG.md`](CHANGELOG.md): release history.
- [`LICENSE`](LICENSE): application use terms.
