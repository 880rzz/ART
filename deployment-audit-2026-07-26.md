# Live deployment audit — 2026-07-26

The repository content and the public `www.banhalmi.art` response are not the same deployment.

Observed on the public domain after the strict remediation merge:

- legacy Wix-style Hungarian homepage remains live;
- stale `huszonöt év` copy remains;
- keyword-stuffed image alternative text remains;
- duplicated partner marquee remains;
- legacy labels such as `review`, `partnerek`, `loo`, and `Berufsfotografie Austria` remain.

The static repository cannot become the public site until the domain is pointed to the deployment generated from this repository. This file records the deployment mismatch so future audits cannot report the repository as live merely because CI passed.
