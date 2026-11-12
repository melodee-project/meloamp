#!/usr/bin/env python3
"""Run local pre-push/pre-PR checks, stopping at the first failure.

Wraps ``scripts/check.py`` so local checks and CI always share one definition
of "green". Requires Node 20+, Yarn 4 (via corepack) and Python 3.9+.

Usage:
    python3 scripts/do-prechecks.py            # everything
    python3 scripts/do-prechecks.py --fast     # skip tests + production build
    python3 scripts/do-prechecks.py --list     # show the gate sequence
"""

from __future__ import annotations

import argparse
import shlex
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_TOOLS = ("git", "node", "yarn", "python3")


@dataclass(frozen=True)
class Check:
    """One named gate in the fail-fast sequence."""

    name: str
    gate: str


def checks_for(*, fast: bool = False) -> list[Check]:
    """Ordered cheapest-first so obvious problems fail before slow builds."""
    checks = [
        Check("Working tree whitespace", "diff"),
        Check("Staged whitespace", "staged"),
        Check("Repository hygiene", "repo"),
        Check("i18n coverage", "i18n"),
        Check("Electron syntax + tests", "electron"),
        Check("UI typecheck", "ui-typecheck"),
        Check("UI lint", "ui-lint"),
    ]
    if not fast:
        checks.append(Check("UI tests with coverage", "ui-tests"))
        checks.append(Check("UI production build", "ui-build"))
    return checks


def validate_environment() -> None:
    """Fail loudly instead of silently skipping a gate."""
    missing = [tool for tool in REQUIRED_TOOLS if shutil.which(tool) is None]
    if missing:
        raise RuntimeError(
            "Required tools missing from PATH: " + ", ".join(missing)
            + ". Install Node 20+, enable Yarn 4 with corepack, and retry."
        )

    for package in (ROOT / "src" / "ui", ROOT / "src" / "electron"):
        if not (package / "node_modules").exists():
            raise RuntimeError(
                f"Dependencies are not installed in {package.relative_to(ROOT)}. "
                f"Run: (cd {package.relative_to(ROOT)} && yarn install --immutable)"
            )


def run_checks(checks: Sequence[Check]) -> int:
    """Stream child output and report timings, failure, and any unrun gates."""
    results: list[tuple[str, float]] = []
    for index, check in enumerate(checks):
        command = (sys.executable, "-u", "scripts/check.py", check.gate)
        print(f"\n[{index + 1}/{len(checks)}] {check.name}", flush=True)
        print(f"$ {shlex.join(command)}", flush=True)
        started = time.monotonic()
        try:
            result = subprocess.run(list(command), cwd=ROOT, shell=False, check=False)
        except OSError as error:
            print(f"FAIL: {check.name}: {error}", file=sys.stderr)
            return 2
        elapsed = time.monotonic() - started
        if result.returncode:
            print(
                f"FAIL: {check.name} (exit {result.returncode}, {elapsed:.1f}s).",
                file=sys.stderr,
            )
            remaining = [item.name for item in checks[index + 1:]]
            if remaining:
                print("Not run: " + ", ".join(remaining), file=sys.stderr)
            return result.returncode if result.returncode > 0 else 128 - result.returncode
        results.append((check.name, elapsed))
        print(f"PASS: {check.name} ({elapsed:.1f}s)", flush=True)

    print("\nPrecheck results:", flush=True)
    for name, elapsed in results:
        print(f"  PASS  {name}: {elapsed:.1f}s", flush=True)
    print(
        f"All {len(results)} selected prechecks passed "
        f"in {sum(elapsed for _, elapsed in results):.1f}s.",
        flush=True,
    )
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="skip the (slow) UI test and production build gates",
    )
    parser.add_argument("--list", action="store_true", help="list the gate sequence and exit")
    args = parser.parse_args(argv)

    checks = checks_for(fast=args.fast)
    if args.list:
        for index, check in enumerate(checks, start=1):
            print(f"{index}. {check.name} (check.py {check.gate})")
        return 0

    try:
        validate_environment()
        print(
            "MeloAmp prechecks: whitespace, repository hygiene, i18n, Electron, "
            "typecheck, lint"
            + ("" if args.fast else ", tests, production build")
            + ".\nChecks stop at the first failure; formatting is checked, not fixed.",
            flush=True,
        )
        return run_checks(checks)
    except RuntimeError as error:
        print(f"Cannot run prechecks: {error}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("\nPrechecks interrupted.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
