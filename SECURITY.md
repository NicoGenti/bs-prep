# Security Policy

## Supported versions

The `main` branch receives security fixes.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through [GitHub security advisories](https://github.com/NicoGenti/bs-prep/security/advisories/new).

Do not open a public issue for an unpatched vulnerability.

Include:

- A clear description of the issue.
- Steps or a proof of concept to reproduce it.
- The affected URL, file, or component.
- The potential impact.
- Any suggested fix, if available.

## Scope

In scope:

- Client-side HTML sanitization and DOM rendering.
- Local progress storage and synchronization merge logic.
- The Cloudflare Worker OAuth token-exchange endpoint.
- GitHub Actions workflows and deployment configuration.

Out of scope:

- Automated scanning noise without a reproducible security impact.
- Missing security headers on third-party services outside this repository.
- Social engineering or attacks requiring physical access.

## Response target

Reports are reviewed as soon as possible. Maintainers will acknowledge valid reports, investigate the issue, and coordinate a fix before public disclosure.
