#!/usr/bin/env python3
"""Canonical quality gates for the MeloAmp repository.

Usage:
    python3 scripts/check.py all
    python3 scripts/check.py repo i18n electron ui-typecheck ui-lint ui-tests ui-build
    python3 scripts/check.py --list

Gates are intentionally small and independently runnable so CI and
``do-prechecks.py`` share one implementation.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable, Sequence

ROOT = Path(__file__).resolve().parents[1]
UI_DIR = ROOT / "src" / "ui"
ELECTRON_DIR = ROOT / "src" / "electron"
LOCALES_DIR = UI_DIR / "src" / "locales"
THEME_REGISTRY = UI_DIR / "src" / "themes" / "registry.ts"


class GateFailure(RuntimeError):
    """Raised when a gate finds a problem (message already formatted)."""


@dataclass(frozen=True)
class Command:
    name: str
    argv: tuple[str, ...]
    cwd: Path


def run(argv: Sequence[str], cwd: Path = ROOT) -> int:
    """Run a command, streaming its output."""
    printable = " ".join(argv)
    print(f"$ {printable}  (cwd={cwd.relative_to(ROOT) or '.'})", flush=True)
    return subprocess.run(list(argv), cwd=cwd, check=False).returncode


def require(condition: bool, message: str, problems: list[str]) -> None:
    if not condition:
        problems.append(message)


# ---------------------------------------------------------------------------
# Repository hygiene
# ---------------------------------------------------------------------------

IGNORED_PATH = re.compile(r"(^|/)(node_modules|coverage|build|dist|\.git)/")


def iter_text_files() -> Iterable[Path]:
    suffixes = {".js", ".ts", ".tsx", ".json", ".py", ".sh", ".ps1", ".bat", ".md", ".yml", ".yaml"}
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in suffixes:
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel.startswith(("node_modules/", ".git/", ".yarn/")):
            continue
        if IGNORED_PATH.search(rel):
            continue
        yield path


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def check_conflict_markers(problems: list[str]) -> None:
    """Detect git conflict markers without flagging Markdown heading rules."""
    for path in iter_text_files():
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        in_conflict = False
        for number, line in enumerate(text.splitlines(), start=1):
            if line.startswith("<<<<<<<"):
                in_conflict = True
                problems.append(f"merge-conflict marker at {path.relative_to(ROOT)}:{number}")
            elif in_conflict and line.rstrip() == "=======":
                problems.append(f"merge-conflict marker at {path.relative_to(ROOT)}:{number}")
            elif line.startswith(">>>>>>>"):
                in_conflict = False
                problems.append(f"merge-conflict marker at {path.relative_to(ROOT)}:{number}")


def check_versions(problems: list[str]) -> None:
    ui_version = read_json(UI_DIR / "package.json").get("version")
    electron_version = read_json(ELECTRON_DIR / "package.json").get("version")
    if ui_version != electron_version:
        problems.append(
            f"version mismatch: src/ui={ui_version!r} src/electron={electron_version!r}"
        )

    changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    if ui_version and f"[{ui_version}]" not in changelog:
        problems.append(f"CHANGELOG.md has no section for version {ui_version}")


def check_scripts_use_yarn(problems: list[str]) -> None:
    shell_scripts = ("*.sh", "*.ps1", "*.bat", "*.zsh")
    for pattern in shell_scripts:
        for script in (ROOT / "scripts").glob(pattern):
            text = script.read_text(encoding="utf-8", errors="ignore")
            if re.search(r"\b(npm install|npm run|npx )", text):
                problems.append(f"{script.relative_to(ROOT)} uses npm; use Yarn 4 instead")


def check_no_posix_only_scripts(problems: list[str]) -> None:
    for package in (UI_DIR / "package.json", ELECTRON_DIR / "package.json"):
        scripts = read_json(package).get("scripts", {})
        for name, command in scripts.items():
            if re.match(r"^[A-Z_][A-Z0-9_]*=", command.strip()):
                problems.append(
                    f"{package.relative_to(ROOT)} script {name!r} uses a POSIX-only inline env var"
                )


def check_gitignore(problems: list[str]) -> None:
    patterns = (ROOT / ".gitignore").read_text(encoding="utf-8")
    for required in ("node_modules/", "src/ui/build/", "src/electron/build/", "src/electron/dist/", "/coverage"):
        if required not in patterns:
            problems.append(f".gitignore is missing {required!r}")


def check_packaging(problems: list[str]) -> None:
    build = read_json(ELECTRON_DIR / "package.json").get("build", {})
    artifact = build.get("artifactName", "")
    if "${arch}" not in artifact:
        problems.append("electron-builder artifactName must include ${arch} to avoid collisions")
    if "${ext}" not in artifact:
        problems.append("electron-builder artifactName must include ${ext}")

    win = build.get("win", {})
    nsis = win.get("nsis", {}).get("artifactName", "")
    portable = win.get("portable", {}).get("artifactName", "")
    if not nsis or not portable:
        problems.append("Windows nsis/portable targets need distinct artifactName values")
    elif nsis == portable:
        problems.append("Windows nsis and portable artifact names collide")

    mac = build.get("mac", {})
    if not mac.get("hardenedRuntime"):
        problems.append("macOS builds must enable hardenedRuntime")
    files = read_json(ELECTRON_DIR / "package.json").get("files", [])
    for required in ("main.js", "preload.js", "helpers.js", "strings.js"):
        if required not in files:
            problems.append(f"src/electron/package.json files is missing {required!r}")


IPC_SEND = re.compile(r"webContents\.send\(\s*'([^']+)'")
IPC_INBOUND = re.compile(r"'([a-z-]+)'")


def check_ipc_channels(problems: list[str]) -> None:
    main_js = (ELECTRON_DIR / "main.js").read_text(encoding="utf-8")
    preload_js = (ELECTRON_DIR / "preload.js").read_text(encoding="utf-8")

    sent = set(IPC_SEND.findall(main_js))
    inbound_block = re.search(r"INBOUND_CHANNELS = Object\.freeze\(\[(.*?)\]\)", preload_js, re.S)
    if not inbound_block:
        problems.append("preload.js must declare an INBOUND_CHANNELS allowlist")
        return
    allowed = set(IPC_INBOUND.findall(inbound_block.group(1)))
    for channel in sorted(sent - allowed):
        problems.append(f"main.js sends {channel!r} but preload.js does not allow it")
    for channel in sorted(allowed - sent):
        problems.append(f"preload.js allows {channel!r} but main.js never sends it")


def check_electron_helpers(problems: list[str]) -> None:
    helpers = (ELECTRON_DIR / "helpers.js").read_text(encoding="utf-8")
    main_js = (ELECTRON_DIR / "main.js").read_text(encoding="utf-8")
    if not re.search(r"require\('\./helpers'\)", main_js):
        problems.append("main.js should import shared helpers from ./helpers")
        return

    required = re.search(r"const \{\s*([^}]*?)\s*\} = require\('\./helpers'\);", main_js)
    exported_block = re.search(r"module\.exports = \{(.*?)\};", helpers, re.S)
    if not required or not exported_block:
        problems.append("helpers.js must expose main.js dependencies via module.exports")
        return

    exported = {name.strip() for name in exported_block.group(1).split(",") if name.strip()}
    for name in (part.strip() for part in required.group(1).split(",")):
        if name and name not in exported:
            problems.append(f"main.js imports {name!r} from helpers.js but it is not exported")


def _opening_tag(source: str, start: int) -> str:
    """Return a JSX opening tag, ignoring `>` inside braces/strings."""
    index = start
    depth = 0
    quote: str | None = None
    while index < len(source):
        char = source[index]
        if quote:
            if char == quote and source[index - 1] != "\\":
                quote = None
        elif char in "\"'`":
            quote = char
        elif char in "{[(":
            depth += 1
        elif char in "}])":
            depth -= 1
        elif char == ">" and depth == 0:
            return source[start:index + 1]
        index += 1
    return source[start:]


def check_icon_button_labels(problems: list[str]) -> None:
    """Icon-only buttons need an accessible name."""
    for source in (UI_DIR / "src").rglob("*.tsx"):
        if ".test." in source.name:
            continue
        text = source.read_text(encoding="utf-8")
        index = 0
        while True:
            index = text.find("<IconButton", index)
            if index == -1:
                break
            tag = _opening_tag(text, index)
            if "aria-label" not in tag:
                line = text.count("\n", 0, index) + 1
                problems.append(
                    f"IconButton without aria-label at {source.relative_to(ROOT)}:{line}"
                )
            index += len("<IconButton")


def check_no_dead_theme_json(problems: list[str]) -> None:
    theme_dir = UI_DIR / "src" / "themes"
    for path in theme_dir.glob("*.json"):
        problems.append(
            f"{path.relative_to(ROOT)} is unused; theme definitions live in registry.ts"
        )


def repo_gate(_: Sequence[str]) -> int:
    problems: list[str] = []
    check_conflict_markers(problems)
    check_versions(problems)
    check_scripts_use_yarn(problems)
    check_no_posix_only_scripts(problems)
    check_gitignore(problems)
    check_packaging(problems)
    check_ipc_channels(problems)
    check_electron_helpers(problems)
    check_no_dead_theme_json(problems)
    check_icon_button_labels(problems)

    if problems:
        raise GateFailure("Repository checks failed:\n  - " + "\n  - ".join(problems))
    print("Repository checks passed.")
    return 0


# ---------------------------------------------------------------------------
# i18n
# ---------------------------------------------------------------------------

TRANSLATION_CALL = re.compile(r"""\bt\(\s*['"]([A-Za-z0-9_.-]+)['"]""")
JSX_TEXT = re.compile(r">\s*([A-Z][A-Za-z0-9 ,'\u2019!?./&()-]{2,})\s*<", re.S)
JSX_TEXT_ALLOWED = {"MeloAmp", "Hz", "dB"}
DYNAMIC_THEME_KEY = re.compile(r"localThemeGallery\.themes\.\$\{([^}]+)\}")
REGISTRY_THEME_ID = re.compile(r"\{\s*id:\s*'([^']+)'")


def flatten_keys(value: object, prefix: str = "") -> set[str]:
    keys: set[str] = set()
    if isinstance(value, dict):
        for key, child in value.items():
            path = f"{prefix}.{key}" if prefix else key
            if isinstance(child, dict):
                keys |= flatten_keys(child, path)
            else:
                keys.add(path)
    return keys


def check_locales(problems: list[str]) -> None:
    en = read_json(LOCALES_DIR / "en.json")
    en_keys = flatten_keys(en)
    locales = {path.stem: flatten_keys(read_json(path)) for path in LOCALES_DIR.glob("*.json")}

    if "en" not in locales:
        problems.append("locales/en.json is missing")
        return

    for locale, keys in sorted(locales.items()):
        if locale == "en":
            continue
        orphaned = keys - en_keys
        if orphaned:
            problems.append(
                f"locales/{locale}.json has keys missing from en.json: "
                + ", ".join(sorted(orphaned)[:5])
            )

    referenced: set[str] = set()
    for source in (UI_DIR / "src").rglob("*"):
        if source.suffix not in {".ts", ".tsx"} or ".test." in source.name:
            continue
        referenced |= set(TRANSLATION_CALL.findall(source.read_text(encoding="utf-8")))

    # Expand dynamic theme keys from the theme registry.
    registry = THEME_REGISTRY.read_text(encoding="utf-8")
    theme_ids = REGISTRY_THEME_ID.findall(registry)
    for source in (UI_DIR / "src").rglob("*.tsx"):
        text = source.read_text(encoding="utf-8")
        for variable in DYNAMIC_THEME_KEY.findall(text):
            if "entry" in variable or "theme" in variable:
                for theme_id in theme_ids:
                    referenced.add(f"localThemeGallery.themes.{theme_id}.name")
                    referenced.add(f"localThemeGallery.themes.{theme_id}.description")

    # i18next pluralisation uses `key_one` / `key_other`; accept those as
    # satisfying a `t('key', { count })` reference.
    def satisfied(key: str) -> bool:
        return key in en_keys or f"{key}_one" in en_keys or f"{key}_other" in en_keys

    missing = {key for key in referenced if not satisfied(key)}
    if missing:
        problems.append(
            "t() keys referenced in code but missing from locales/en.json: "
            + ", ".join(sorted(missing))
        )


def check_hardcoded_jsx_text(problems: list[str]) -> None:
    """Flag obvious untranslated JSX text nodes (e.g. ``<Typography>Delete</Typography>``)."""
    for source in (UI_DIR / "src").rglob("*.tsx"):
        if ".test." in source.name:
            continue
        text = source.read_text(encoding="utf-8")
        for match in JSX_TEXT.finditer(text):
            snippet = " ".join(match.group(1).split())
            if snippet in JSX_TEXT_ALLOWED:
                continue
            line = text.count("\n", 0, match.start()) + 1
            problems.append(
                f"hardcoded UI text at {source.relative_to(ROOT)}:{line}: {snippet!r} "
                "(use t())"
            )


def i18n_gate(_: Sequence[str]) -> int:
    problems: list[str] = []
    check_locales(problems)
    check_hardcoded_jsx_text(problems)
    if problems:
        raise GateFailure("i18n checks failed:\n  - " + "\n  - ".join(problems))
    print("i18n checks passed.")
    return 0


# ---------------------------------------------------------------------------
# Command gates
# ---------------------------------------------------------------------------

def command_gate(commands: Sequence[Command]) -> int:
    for command in commands:
        code = run(command.argv, cwd=command.cwd)
        if code:
            raise GateFailure(f"{command.name} failed (exit {code})")
    return 0


def ui_commands() -> list[Command]:
    yarn = shutil.which("yarn") or "yarn"
    node = shutil.which("node") or "node"
    tsc = UI_DIR / "node_modules" / "typescript" / "bin" / "tsc"
    eslint = UI_DIR / "node_modules" / ".bin" / "eslint"

    typecheck = (node, str(tsc), "--noEmit") if tsc.exists() else (yarn, "typecheck")
    lint = (node, str(eslint), "src", "--ext", ".ts,.tsx", "--max-warnings", "0") if eslint.exists() else (yarn, "lint")

    return [
        Command("UI typecheck", typecheck, UI_DIR),
        Command("UI lint", lint, UI_DIR),
        Command("UI tests (coverage)", (yarn, "test:coverage"), UI_DIR),
        Command("UI production build", (yarn, "build"), UI_DIR),
    ]


def electron_commands() -> list[Command]:
    node = shutil.which("node") or "node"
    return [
        Command("Electron syntax", (node, "--check", "main.js"), ELECTRON_DIR),
        Command("Preload syntax", (node, "--check", "preload.js"), ELECTRON_DIR),
        Command("Main-process helper tests", (node, "--test", "helpers.test.js", "strings.test.js"), ELECTRON_DIR),
    ]


def git_diff_gate(args: Sequence[str]) -> int:
    code = run(("git", "diff", *args, "--check"))
    if code:
        raise GateFailure("git diff --check reported whitespace errors")
    return 0


GATES: dict[str, Callable[[Sequence[str]], int]] = {
    "diff": lambda _: git_diff_gate(()),
    "staged": lambda _: git_diff_gate(("--cached",)),
    "repo": repo_gate,
    "i18n": i18n_gate,
    "electron": lambda _: command_gate(electron_commands()),
    "ui-typecheck": lambda _: command_gate(ui_commands()[:1]),
    "ui-lint": lambda _: command_gate(ui_commands()[1:2]),
    "ui-tests": lambda _: command_gate(ui_commands()[2:3]),
    "ui-build": lambda _: command_gate(ui_commands()[3:4]),
}

ALL_GATES = [
    "diff",
    "staged",
    "repo",
    "i18n",
    "electron",
    "ui-typecheck",
    "ui-lint",
    "ui-tests",
    "ui-build",
]


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("gates", nargs="*", help="gates to run (default: all)")
    parser.add_argument("--list", action="store_true", help="list available gates and exit")
    args = parser.parse_args(argv)

    if args.list:
        for name in ALL_GATES:
            print(name)
        return 0

    selected = args.gates or ["all"]
    if "all" in selected:
        selected = ALL_GATES

    unknown = [name for name in selected if name not in GATES]
    if unknown:
        print(f"Unknown gate(s): {', '.join(unknown)}", file=sys.stderr)
        return 2

    for name in selected:
        print(f"\n=== {name} ===", flush=True)
        try:
            code = GATES[name]([])
        except GateFailure as error:
            print(f"\nFAIL: {name}\n{error}", file=sys.stderr)
            return 1
        if code:
            return code
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
