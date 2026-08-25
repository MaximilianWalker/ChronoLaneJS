# Security policy

## Reporting a vulnerability

Do not disclose a suspected vulnerability in a public issue, pull request,
discussion, or commit. Use this repository's enabled
[private vulnerability reporting form](https://github.com/MaximilianWalker/ChronoLaneJS/security/advisories/new).

Include the affected version, impact, reproduction steps or a proof of concept,
and any known mitigations. The maintainer will keep triage and remediation
inside the private GitHub security advisory until a coordinated release is
available.

## Supported versions

Only the version currently published under npm's `latest` distribution tag and
marked as the latest stable GitHub release receives security fixes. Older
stable versions and prereleases are not supported. Consumers should upgrade to
the latest stable release before reporting a version-specific problem.

## Remediation and disclosure

The maintainer handles a confirmed vulnerability through a draft GitHub security
advisory and, when code changes are required, its
[temporary private fork](https://docs.github.com/en/code-security/tutorials/fix-reported-vulnerabilities/collaborate-in-a-fork).
The fix targets the latest supported release. GitHub integrations and CI cannot
access temporary private forks, so the maintainer runs the repository's required
validation locally while the fix remains confidential.

When the fix is ready, the maintainer bases its release-bearing `fix:` commit
on `main` and uses GitHub's security-advisory merge control to land it in the
public repository. The resulting `main` push runs the gated release workflow,
which validates and publishes the patched npm version. The advisory is
published after the patched package is available. `main` is then merged back
into `dev` so ongoing development contains the fix and both branches retain
shared ancestry.

The advisory publication records affected versions, the patched version,
impact, mitigations, and credit when the reporter wants attribution. If a
release cannot be produced safely, the maintainer publishes mitigation guidance
in the advisory rather than moving the report to a public issue prematurely.
