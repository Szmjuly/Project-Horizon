#!/usr/bin/env python3
"""
Project Horizons - Master Content Generator

Reads JSON definition files and generates all quest, trainer, NPC, and
storybook content for the Project Horizons Minecraft modpack.

Outputs:
  - FTB Quests SNBT  -> server/config/ftbquests/quests/
  - RCT trainers     -> server/kubejs/data/rctmod/
  - Custom NPC scripts -> server/customnpcs/scripts/ecmascript/
  - Patchouli storybook -> datapacks/horizons-core/data/horizons/patchouli_books/horizons_storybook/
  - Storybook advancements -> datapacks/horizons-core/data/horizons/advancements/storybook/

Requires Python 3.10+.  No third-party packages.

Usage:
    python generate_content.py --all          # Generate everything
    python generate_content.py --quests       # FTB Quests only
    python generate_content.py --trainers     # RCT trainers only
    python generate_content.py --npcs         # Custom NPCs only
    python generate_content.py --storybook    # Living Storybook only
    python generate_content.py --validate     # Validate definitions only
    python generate_content.py --dry-run      # Show what would be generated
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import textwrap
import time
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = PROJECT_ROOT / "tools"
QUEST_DEFS = TOOLS_DIR / "quest_definitions.json"
TRAINER_DEFS = TOOLS_DIR / "trainer_definitions.json"
NPC_DEFS = TOOLS_DIR / "npc_definitions.json"
STORYBOOK_DEFS = TOOLS_DIR / "storybook_definitions.json"
QUEST_OUTPUT = PROJECT_ROOT / "server" / "config" / "ftbquests" / "quests"
TRAINER_OUTPUT = PROJECT_ROOT / "server" / "kubejs" / "data" / "rctmod"
NPC_OUTPUT = PROJECT_ROOT / "server" / "customnpcs" / "scripts" / "ecmascript"
STORYBOOK_OUTPUT = PROJECT_ROOT / "datapacks" / "horizons-core" / "data" / "horizons" / "patchouli_books" / "horizons_storybook"
ADVANCEMENT_OUTPUT = PROJECT_ROOT / "datapacks" / "horizons-core" / "data" / "horizons" / "advancements" / "storybook"

# ---------------------------------------------------------------------------
# SNBT Serializer
# ---------------------------------------------------------------------------

def _key_needs_quoting(key: str) -> bool:
    if not key:
        return True
    return any(not (ch.isalnum() or ch == "_") for ch in key)

def _format_double(val: float) -> str:
    if val == int(val):
        return f"{val:.1f}d"
    return f"{val}d" if "." in str(val) else f"{val:.1f}d"

def _escape_snbt(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')

class SNBTWriter:
    """Serialize Python dicts into FTB Quests SNBT format.

    Rules: bare keys, ``d`` suffix on floats, newline-separated array
    elements (no commas), tab indentation, double-quoted strings.
    """
    def __init__(self) -> None:
        self._parts: list[str] = []

    def serialize(self, obj: dict) -> str:
        self._parts = []
        self._write_compound(obj, 0)
        return "\n".join(self._parts) + "\n"

    def _ind(self, d: int) -> str:
        return "\t" * d

    def _write_compound(self, obj: dict, d: int) -> None:
        self._parts.append(f"{self._ind(d)}{{")
        for k, v in obj.items():
            self._write_entry(k, v, d + 1)
        self._parts.append(f"{self._ind(d)}}}")

    def _write_entry(self, key: str, value: object, d: int) -> None:
        ind = self._ind(d)
        ks = f'"{key}"' if _key_needs_quoting(key) else key
        if isinstance(value, dict):
            self._parts.append(f"{ind}{ks}: {{")
            for k2, v2 in value.items():
                self._write_entry(k2, v2, d + 1)
            self._parts.append(f"{ind}}}")
        elif isinstance(value, list):
            self._write_array(ks, value, d)
        elif isinstance(value, bool):
            self._parts.append(f"{ind}{ks}: {'true' if value else 'false'}")
        elif isinstance(value, float):
            self._parts.append(f"{ind}{ks}: {_format_double(value)}")
        elif isinstance(value, int):
            self._parts.append(f"{ind}{ks}: {value}")
        elif isinstance(value, str):
            self._parts.append(f'{ind}{ks}: "{_escape_snbt(value)}"')
        else:
            self._parts.append(f'{ind}{ks}: "{value}"')

    def _write_array(self, ks: str, items: list, d: int) -> None:
        ind = self._ind(d)
        if not items:
            self._parts.append(f"{ind}{ks}: [ ]")
            return
        # Short string arrays inline
        if all(isinstance(i, str) for i in items) and len(items) <= 4:
            parts = ", ".join(f'"{_escape_snbt(s)}"' for s in items)
            self._parts.append(f"{ind}{ks}: [{parts}]")
            return
        # Single-element compound: compact [{...}]
        if len(items) == 1 and isinstance(items[0], dict):
            self._parts.append(f"{ind}{ks}: [{{")
            for k, v in items[0].items():
                self._write_entry(k, v, d + 1)
            self._parts.append(f"{ind}}}]")
            return
        # Arrays of single-key string dicts: compact { key: "val" } per line
        if (all(isinstance(i, dict) and len(i) == 1 for i in items)
                and all(isinstance(v, str) for i in items for v in i.values())):
            self._parts.append(f"{ind}{ks}: [")
            for item in items:
                k, v = next(iter(item.items()))
                kk = f'"{k}"' if _key_needs_quoting(k) else k
                self._parts.append(f'{self._ind(d+1)}{{ {kk}: "{_escape_snbt(v)}" }}')
            self._parts.append(f"{ind}]")
            return
        # General multi-element array
        self._parts.append(f"{ind}{ks}: [")
        for item in items:
            if isinstance(item, dict):
                self._write_compound(item, d + 1)
            elif isinstance(item, str):
                self._parts.append(f'{self._ind(d+1)}"{_escape_snbt(item)}"')
            elif isinstance(item, bool):
                self._parts.append(f"{self._ind(d+1)}{'true' if item else 'false'}")
            elif isinstance(item, float):
                self._parts.append(f"{self._ind(d+1)}{_format_double(item)}")
            elif isinstance(item, int):
                self._parts.append(f"{self._ind(d+1)}{item}")
        self._parts.append(f"{ind}]")

# ---------------------------------------------------------------------------
# Deterministic ID Generator
# ---------------------------------------------------------------------------

def generate_id(seed: str, path: str) -> str:
    """SHA-256 of seed+path, first 16 hex digits uppercased."""
    return hashlib.sha256(f"{seed}{path}".encode()).hexdigest()[:16].upper()

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

class ValidationError:
    def __init__(self, level: str, source: str, message: str) -> None:
        self.level, self.source, self.message = level, source, message
    def __str__(self) -> str:
        return f"  [{self.level}] {self.source}: {self.message}"

def validate_quest_definitions(defs: dict) -> list[ValidationError]:
    errors: list[ValidationError] = []
    meta = defs.get("meta", {})
    if not meta.get("id_seed"):
        errors.append(ValidationError("ERROR", "meta", "Missing id_seed"))
    if "version" not in meta:
        errors.append(ValidationError("WARN", "meta", "Missing version, defaulting to 13"))
    groups = {g["key"] for g in defs.get("chapter_groups", [])}
    all_quest_keys: set[str] = set()
    chapters = defs.get("chapters", {})
    for ch_key, ch_data in chapters.items():
        if not ch_data.get("title"):
            errors.append(ValidationError("ERROR", f"chapter.{ch_key}", "Missing title"))
        grp = ch_data.get("group", "")
        if grp and grp not in groups:
            errors.append(ValidationError("ERROR", f"chapter.{ch_key}",
                                          f"References unknown group '{grp}'"))
        for quest in ch_data.get("quests", []):
            qkey = quest.get("key", "")
            if not qkey:
                errors.append(ValidationError("ERROR", f"chapter.{ch_key}", "Quest missing key"))
                continue
            if qkey in all_quest_keys:
                errors.append(ValidationError("ERROR", f"{ch_key}.{qkey}", "Duplicate quest key"))
            all_quest_keys.add(qkey)
            if not quest.get("tasks"):
                errors.append(ValidationError("WARN", f"{ch_key}.{qkey}", "Quest has no tasks"))
    # Dependency resolution pass
    for ch_key, ch_data in chapters.items():
        for quest in ch_data.get("quests", []):
            for dep in quest.get("deps", []):
                if dep not in all_quest_keys:
                    errors.append(ValidationError(
                        "ERROR", f"{ch_key}.{quest.get('key','?')}",
                        f"Dependency '{dep}' not found"))
    return errors

# ---------------------------------------------------------------------------
# Quest Generation
# ---------------------------------------------------------------------------

def _build_task(task: dict, task_id: str) -> dict:
    t = {"id": task_id, "type": task.get("type", "checkmark")}
    if task["type"] == "item":
        t["item"] = {"count": task.get("count", 1), "id": task.get("item", "minecraft:stone")}
    elif task["type"] == "stat":
        t["stat"] = task.get("stat", "")
        t["value"] = task.get("value", 1)
    elif task["type"] == "advancement":
        t["advancement"] = task.get("advancement", "")
        t["criterion"] = task.get("criterion", "")
    elif task["type"] == "dimension":
        t["dimension"] = task.get("dimension", "minecraft:overworld")
    return t

def _build_reward(reward: dict, reward_id: str) -> dict:
    rtype = reward.get("type", "xp")

    # Convert Horizons custom reward types to FTB Quests command rewards
    if rtype == "perk_points":
        return {"id": reward_id, "type": "command",
                "command": f"/horizons reward perkpoints {reward.get('amount', 10)}",
                "player_command": False}
    elif rtype == "stage":
        return {"id": reward_id, "type": "command",
                "command": f"/horizons reward stage {reward.get('stage', '')}",
                "player_command": False}
    elif rtype == "reputation":
        return {"id": reward_id, "type": "command",
                "command": f"/horizons reward reputation {reward.get('faction', 'plains')} {reward.get('amount', 10)}",
                "player_command": False}
    elif rtype == "currency":
        return {"id": reward_id, "type": "command",
                "command": f"/horizons reward currency {reward.get('currency_type', 'lightman')} {reward.get('amount', 1)}",
                "player_command": False}
    elif rtype == "crimestat":
        return {"id": reward_id, "type": "command",
                "command": f"/horizons reward crimestat {reward.get('change', -1)}",
                "player_command": False}

    # Standard FTB Quests reward types
    r = {"id": reward_id, "type": rtype}
    if rtype == "xp":
        r["xp"] = reward.get("xp", 10)
    elif rtype == "xp_levels":
        r["xp_levels"] = reward.get("xp_levels", 1)
    elif rtype == "item":
        count = reward.get("count", 1)
        if count > 1:
            r["count"] = count
        r["item"] = {"count": 1, "id": reward.get("item", "minecraft:stone")}
    elif rtype == "command":
        r["command"] = reward.get("command", "")
        r["player_command"] = reward.get("player_command", False)
    return r

def generate_quests(defs: dict, dry_run: bool = False) -> dict:
    seed = defs["meta"]["id_seed"]
    version = defs["meta"].get("version", 13)
    writer = SNBTWriter()
    stats = {"chapters": 0, "quests": 0, "tasks": 0, "rewards": 0, "files": 0}

    # Pre-map all quest keys to IDs for dependency resolution
    quest_id_map: dict[str, str] = {}
    for ch_key, ch_data in defs.get("chapters", {}).items():
        for quest in ch_data.get("quests", []):
            quest_id_map[quest["key"]] = generate_id(seed, f"{ch_key}.{quest['key']}")

    # chapter_groups.snbt
    group_id_map: dict[str, str] = {}
    group_entries: list[dict] = []
    for grp in defs.get("chapter_groups", []):
        gid = generate_id(seed, f"group.{grp['key']}")
        group_id_map[grp["key"]] = gid
        group_entries.append({"id": gid})
    cg_snbt = writer.serialize({"chapter_groups": group_entries})

    # data.snbt
    data_snbt = writer.serialize({
        "default_autoclaim_rewards": "disabled", "default_consume_items": False,
        "default_quest_disable_jei": False, "default_quest_shape": "circle",
        "default_reward_team": False, "detection_delay": 60, "disable_gui": False,
        "drop_book_on_death": False, "drop_loot_crates": False,
        "emergency_items_cooldown": 300, "grid_scale": 0.5, "lock_message": "",
        "pause_game": False, "progression_mode": "flexible",
        "show_lock_icons": True, "verify_on_load": False, "version": version,
    })

    # Per-chapter
    chapter_files: dict[str, str] = {}
    lang_files: dict[str, str] = {}
    chapter_lang: dict[str, str] = {}

    for ch_key, ch_data in defs.get("chapters", {}).items():
        ch_id = generate_id(seed, f"chapter.{ch_key}")
        group_ref = group_id_map.get(ch_data.get("group", ""), "")
        chapter_lang[f"chapter.{ch_id}.title"] = ch_data.get("title", ch_key)

        quests_snbt: list[dict] = []
        lang_entries: dict[str, str | list[str]] = {}

        for quest in ch_data.get("quests", []):
            qkey, qid = quest["key"], quest_id_map[quest["key"]]
            lang_entries[f"quest.{qid}.title"] = quest.get("title", qkey)
            if quest.get("description"):
                lang_entries[f"quest.{qid}.quest_desc"] = quest["description"]
            if quest.get("subtitle"):
                lang_entries[f"quest.{qid}.quest_subtitle"] = quest["subtitle"]

            tasks_list = []
            for ti, task in enumerate(quest.get("tasks", [])):
                tid = generate_id(seed, f"{ch_key}.{qkey}.task_{ti}")
                tasks_list.append(_build_task(task, tid))
                stats["tasks"] += 1
                if task.get("title"):
                    lang_entries[f"task.{tid}.title"] = task["title"]

            rewards_list = []
            for ri, reward in enumerate(quest.get("rewards", [])):
                rid = generate_id(seed, f"{ch_key}.{qkey}.reward_{ri}")
                rewards_list.append(_build_reward(reward, rid))
                stats["rewards"] += 1

            deps = [quest_id_map[d] for d in quest.get("deps", []) if d in quest_id_map]

            q: dict = {}
            if deps:
                q["dependencies"] = deps
            if quest.get("icon"):
                q["icon"] = {"id": quest["icon"]}
            q["id"] = qid
            q["rewards"] = rewards_list
            if quest.get("shape"):
                q["shape"] = quest["shape"]
            size = quest.get("size", 0)
            if size and size != 1.0:
                q["size"] = float(size)
            q["tasks"] = tasks_list
            q["x"] = float(quest.get("x", 0.0))
            q["y"] = float(quest.get("y", 0.0))
            quests_snbt.append(q)
            stats["quests"] += 1

        ch_obj = {
            "default_hide_dependency_lines": False, "default_quest_shape": "",
            "filename": ch_key,
            "group": group_ref,
            "icon": {"id": ch_data.get("icon", "ftbquests:book")},
            "id": ch_id, "images": [],
            "order_index": ch_data.get("order", 0),
            "progression_mode": "flexible", "quest_links": [], "quests": quests_snbt,
        }
        chapter_files[ch_key] = writer.serialize(ch_obj)
        lang_files[ch_key] = writer.serialize(lang_entries)
        stats["chapters"] += 1

    master_lang = writer.serialize(chapter_lang)

    if dry_run:
        print("\n  [DRY RUN] Would write quest files:")
        print(f"    {QUEST_OUTPUT / 'data.snbt'}")
        print(f"    {QUEST_OUTPUT / 'chapter_groups.snbt'}")
        print(f"    {QUEST_OUTPUT / 'lang' / 'en_us' / 'chapter.snbt'}")
        for name in chapter_files:
            print(f"    {QUEST_OUTPUT / 'chapters' / (name + '.snbt')}")
            print(f"    {QUEST_OUTPUT / 'lang' / 'en_us' / 'chapters' / (name + '.snbt')}")
    else:
        _write_file(QUEST_OUTPUT / "data.snbt", data_snbt)
        _write_file(QUEST_OUTPUT / "chapter_groups.snbt", cg_snbt)
        _write_file(QUEST_OUTPUT / "lang" / "en_us" / "chapter.snbt", master_lang)
        stats["files"] += 3
        for name, content in chapter_files.items():
            _write_file(QUEST_OUTPUT / "chapters" / f"{name}.snbt", content)
            stats["files"] += 1
        for name, content in lang_files.items():
            _write_file(QUEST_OUTPUT / "lang" / "en_us" / "chapters" / f"{name}.snbt", content)
            stats["files"] += 1
    return stats

# ---------------------------------------------------------------------------
# Trainer Generation (RCT mod)
# ---------------------------------------------------------------------------

def generate_trainers(defs: dict, dry_run: bool = False) -> dict:
    stats = {"trainer_types": 0, "trainers": 0, "loot_tables": 0, "files": 0}
    seed = defs.get("meta", {}).get("id_seed", "horizons_trainers")

    for ttype in defs.get("trainer_types", []):
        tk = ttype["key"]
        obj = {
            "type": tk, "id": generate_id(seed, f"trainer_type.{tk}"),
            "display_name": ttype.get("display_name", tk.replace("_", " ").title()),
            "badge": ttype.get("badge", ""),
            "battle_rules": ttype.get("battle_rules", {"level_cap": 100}),
        }
        path = TRAINER_OUTPUT / "trainer_types" / f"{tk}.json"
        if dry_run:
            print(f"    {path}")
        else:
            _write_json(path, obj)
            stats["files"] += 1
        stats["trainer_types"] += 1

    for trainer in defs.get("trainers", []):
        tk = trainer["key"]
        t_obj = {
            "id": generate_id(seed, f"trainer.{tk}"), "key": tk,
            "display_name": trainer.get("display_name", tk.replace("_", " ").title()),
            "type": trainer.get("type", "generic"), "team": [],
            "dialogue": trainer.get("dialogue", {}),
            "rewards": trainer.get("rewards", {}),
        }
        for poke in trainer.get("team", []):
            p = {"species": poke.get("species", "bulbasaur"),
                 "level": poke.get("level", 5), "moves": poke.get("moves", [])}
            for opt in ("ability", "nature", "held_item"):
                if poke.get(opt):
                    p[opt] = poke[opt]
            t_obj["team"].append(p)

        tp = TRAINER_OUTPUT / "trainers" / f"{tk}.json"
        if dry_run:
            print(f"    {tp}")
        else:
            _write_json(tp, t_obj)
            stats["files"] += 1
        stats["trainers"] += 1

        loot = trainer.get("loot_table")
        if loot:
            loot_obj: dict = {"type": "minecraft:generic", "pools": []}
            for pool in loot.get("pools", []):
                pool_obj: dict = {"rolls": pool.get("rolls", 1), "entries": []}
                for entry in pool.get("entries", []):
                    e: dict = {"type": "minecraft:item",
                               "name": entry.get("item", "minecraft:stone"),
                               "weight": entry.get("weight", 1)}
                    cnt = entry.get("count", 1)
                    e["functions"] = ([{"function": "minecraft:set_count",
                                        "count": cnt}] if cnt > 1 else [])
                    pool_obj["entries"].append(e)
                loot_obj["pools"].append(pool_obj)
            lp = TRAINER_OUTPUT / "loot_table" / f"{tk}.json"
            if dry_run:
                print(f"    {lp}")
            else:
                _write_json(lp, loot_obj)
                stats["files"] += 1
            stats["loot_tables"] += 1

    if dry_run and not stats["trainers"] and not stats["trainer_types"]:
        print("    (no trainers defined)")
    return stats

# ---------------------------------------------------------------------------
# NPC Generation (Custom NPCs)
# ---------------------------------------------------------------------------

def _escape_js(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")

def generate_npcs(defs: dict, dry_run: bool = False) -> dict:
    stats = {"npcs": 0, "dialogues": 0, "files": 0}
    seed = defs.get("meta", {}).get("id_seed", "horizons_npcs")

    npcs_data = defs.get("npcs", {})
    # Support both dict-of-dicts and list-of-dicts formats
    if isinstance(npcs_data, dict):
        npc_list = [{"key": k, **v} for k, v in npcs_data.items()]
    else:
        npc_list = npcs_data

    for npc in npc_list:
        nk = npc["key"]
        nid = generate_id(seed, f"npc.{nk}")
        display = npc.get("display_name", nk.replace("_", " ").title())
        dialogues = npc.get("dialogues", [])

        L: list[str] = [
            f"// Auto-generated NPC script for: {display}",
            f"// NPC ID: {nid}", f"// Key: {nk}", "",
            "function init(event) {",
            f'    event.npc.display.setName("{_escape_js(display)}");',
        ]
        if npc.get("skin"):
            L.append(f'    event.npc.display.setSkinUrl("{_escape_js(npc["skin"])}");')
        L += ["}", "", "function interact(event) {",
              "    var player = event.player;",
              "    var dialog = event.npc.dialog;", ""]

        if dialogues:
            L.append(f'    var stage = player.storeddata.get("npc_stage_{nk}");')
            L.append('    if (stage === null) stage = "default";')
            L.append("")
            for di, dlg in enumerate(dialogues):
                stage = dlg.get("stage", "default")
                kw = "if" if di == 0 else "} else if"
                L.append(f'    {kw} (stage === "{_escape_js(stage)}") {{')
                if dlg.get("condition"):
                    L.append(f"        // Condition: {dlg['condition']}")
                L.append(f'        dialog.say("{_escape_js(dlg.get("text", "..."))}");')
                for cmd in dlg.get("commands", []):
                    L.append(f'        event.npc.executeCommand("{_escape_js(cmd)}");')
                if dlg.get("next_stage"):
                    L.append(f'        player.storeddata.put("npc_stage_{nk}", '
                             f'"{_escape_js(dlg["next_stage"])}");')
                stats["dialogues"] += 1
            L.append("    }")
        else:
            L.append('    dialog.say("Hello there, trainer!");')
            stats["dialogues"] += 1
        L += ["}", ""]

        sp = NPC_OUTPUT / f"{nk}.js"
        if dry_run:
            print(f"    {sp}")
        else:
            _write_file(sp, "\n".join(L))
            stats["files"] += 1
        stats["npcs"] += 1

    if dry_run and not stats["npcs"]:
        print("    (no NPCs defined)")
    return stats

# ---------------------------------------------------------------------------
# Storybook Generation (Patchouli Living Storybook)
# ---------------------------------------------------------------------------

IMPOSSIBLE_ADVANCEMENT = {
    "criteria": {
        "trigger": {
            "trigger": "minecraft:impossible"
        }
    }
}

def generate_storybook(defs: dict, dry_run: bool = False) -> dict:
    """Generate Patchouli storybook entries and advancement JSONs from definitions."""
    stats = {"categories": 0, "entries": 0, "advancements": 0, "files": 0}
    book = defs.get("book", {})

    # book.json
    book_json = {
        "name": book.get("name", "Living Storybook"),
        "landing_text": book.get("landing_text", "Your journey awaits..."),
        "book_texture": book.get("texture", "patchouli:textures/gui/book_brown.png"),
        "model": book.get("model", "patchouli:book_brown"),
        "show_progress": book.get("show_progress", True),
        "i18n": False,
        "version": str(book.get("version", "1")),
        "subtitle": book.get("subtitle", "Your Journey Through Aetheria"),
    }
    bp = STORYBOOK_OUTPUT / "book.json"
    if dry_run:
        print(f"    {bp}")
    else:
        _write_json(bp, book_json)
        stats["files"] += 1

    # Categories
    for cat in defs.get("categories", []):
        cat_json: dict = {
            "name": cat["name"],
            "description": cat.get("description", ""),
            "icon": cat.get("icon", "minecraft:book"),
            "sortnum": cat.get("sortnum", 0),
        }
        if cat.get("advancement"):
            cat_json["advancement"] = cat["advancement"]

        cp = STORYBOOK_OUTPUT / "en_us" / "categories" / f"{cat['key']}.json"
        if dry_run:
            print(f"    {cp}")
        else:
            _write_json(cp, cat_json)
            stats["files"] += 1
        stats["categories"] += 1

    # Entries + Advancements
    for entry in defs.get("entries", []):
        cat_key = entry["category_key"]
        entry_key = entry["key"]
        adv_path = entry.get("advancement_path", f"{cat_key}/{entry_key}")

        # Patchouli entry
        entry_json: dict = {
            "name": entry["name"],
            "icon": entry.get("icon", "minecraft:book"),
            "category": f"horizons:{entry.get('category_ref', cat_key)}",
            "advancement": f"horizons:storybook/{adv_path}",
            "sortnum": entry.get("sortnum", 0),
            "pages": [],
        }
        for page in entry.get("pages", []):
            entry_json["pages"].append({
                "type": "patchouli:text",
                "title": page.get("title", ""),
                "text": page.get("text", ""),
            })

        ep = STORYBOOK_OUTPUT / "en_us" / "entries" / cat_key / f"{entry_key}.json"
        if dry_run:
            print(f"    {ep}")
        else:
            _write_json(ep, entry_json)
            stats["files"] += 1
        stats["entries"] += 1

        # Advancement (impossible trigger)
        ap = ADVANCEMENT_OUTPUT / f"{adv_path}.json"
        if dry_run:
            print(f"    {ap}")
        else:
            _write_json(ap, IMPOSSIBLE_ADVANCEMENT)
            stats["files"] += 1
        stats["advancements"] += 1

    return stats

# ---------------------------------------------------------------------------
# File I/O helpers
# ---------------------------------------------------------------------------

def _write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")

def _write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(obj, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

def _load_json(path: Path, label: str) -> dict | None:
    if not path.is_file():
        print(f"  [WARN] {label} not found: {path}")
        return None
    try:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except json.JSONDecodeError as exc:
        print(f"  [ERROR] Failed to parse {path}: {exc}")
        return None

# ---------------------------------------------------------------------------
# CLI & Main
# ---------------------------------------------------------------------------

def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Project Horizons - Master Content Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""\
            examples:
              python generate_content.py --all
              python generate_content.py --quests --dry-run
              python generate_content.py --validate
        """),
    )
    g = p.add_argument_group("generation targets")
    g.add_argument("--all", action="store_true", help="Generate everything")
    g.add_argument("--quests", action="store_true", help="Generate FTB Quests SNBT only")
    g.add_argument("--trainers", action="store_true", help="Generate RCT trainer JSON only")
    g.add_argument("--npcs", action="store_true", help="Generate Custom NPC scripts only")
    g.add_argument("--storybook", action="store_true", help="Generate Living Storybook only")
    g.add_argument("--validate", action="store_true", help="Validate definitions only")
    p.add_argument("--dry-run", action="store_true", help="Show what would be generated")
    return p.parse_args(argv)

def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    if not any([args.all, args.quests, args.trainers, args.npcs, args.storybook, args.validate]):
        args.all = True

    do_q = args.all or args.quests
    do_t = args.all or args.trainers
    do_n = args.all or args.npcs
    do_s = args.all or args.storybook
    do_v = args.validate

    start = time.monotonic()
    print("=" * 60)
    print("  Project Horizons - Content Generator")
    print("=" * 60)
    if args.dry_run:
        print("  Mode: DRY RUN (no files will be written)\n")
    elif do_v:
        print("  Mode: VALIDATE ONLY\n")
    else:
        print()

    quest_defs = trainer_defs = npc_defs = storybook_defs = None
    if do_q or do_v:
        print("[1] Loading quest definitions ...")
        quest_defs = _load_json(QUEST_DEFS, "quest_definitions.json")
    if do_t:
        print("[2] Loading trainer definitions ...")
        trainer_defs = _load_json(TRAINER_DEFS, "trainer_definitions.json")
    if do_n:
        print("[3] Loading NPC definitions ...")
        npc_defs = _load_json(NPC_DEFS, "npc_definitions.json")
    if do_s:
        print("[4] Loading storybook definitions ...")
        storybook_defs = _load_json(STORYBOOK_DEFS, "storybook_definitions.json")

    # Validation
    if quest_defs and (do_v or do_q):
        print("\n--- Validating quest definitions ---")
        errors = validate_quest_definitions(quest_defs)
        errs = sum(1 for e in errors if e.level == "ERROR")
        warns = sum(1 for e in errors if e.level == "WARN")
        for err in errors:
            print(str(err))
        if errs:
            print(f"\n  {errs} error(s), {warns} warning(s)")
            if not do_v:
                print("  Aborting generation due to errors.")
                sys.exit(1)
        elif warns:
            print(f"  {warns} warning(s), 0 errors - OK")
        else:
            print("  All checks passed.")

    if do_v:
        print(f"\nValidation complete in {time.monotonic() - start:.2f}s.")
        return

    # Generation
    total: dict[str, int] = {}
    if do_q and quest_defs:
        print("\n--- Generating FTB Quests ---")
        for k, v in generate_quests(quest_defs, dry_run=args.dry_run).items():
            total[f"quest_{k}"] = v
    if do_t and trainer_defs:
        print("\n--- Generating RCT Trainers ---")
        if args.dry_run:
            print("  [DRY RUN] Would write trainer files:")
        for k, v in generate_trainers(trainer_defs, dry_run=args.dry_run).items():
            total[f"trainer_{k}"] = v
    if do_n and npc_defs:
        print("\n--- Generating Custom NPCs ---")
        if args.dry_run:
            print("  [DRY RUN] Would write NPC files:")
        for k, v in generate_npcs(npc_defs, dry_run=args.dry_run).items():
            total[f"npc_{k}"] = v
    if do_s and storybook_defs:
        print("\n--- Generating Living Storybook ---")
        if args.dry_run:
            print("  [DRY RUN] Would write storybook files:")
        for k, v in generate_storybook(storybook_defs, dry_run=args.dry_run).items():
            total[f"storybook_{k}"] = v

    # Summary
    elapsed = time.monotonic() - start
    print("\n" + "=" * 60)
    print("  GENERATION SUMMARY")
    print("=" * 60)
    if do_q and quest_defs:
        print(f"  Chapters:      {total.get('quest_chapters', 0)}")
        print(f"  Quests:        {total.get('quest_quests', 0)}")
        print(f"  Tasks:         {total.get('quest_tasks', 0)}")
        print(f"  Rewards:       {total.get('quest_rewards', 0)}")
        print(f"  Quest files:   {total.get('quest_files', 0)}")
    if do_t and trainer_defs:
        print(f"  Trainer types: {total.get('trainer_trainer_types', 0)}")
        print(f"  Trainers:      {total.get('trainer_trainers', 0)}")
        print(f"  Loot tables:   {total.get('trainer_loot_tables', 0)}")
        print(f"  Trainer files: {total.get('trainer_files', 0)}")
    if do_n and npc_defs:
        print(f"  NPCs:          {total.get('npc_npcs', 0)}")
        print(f"  Dialogues:     {total.get('npc_dialogues', 0)}")
        print(f"  NPC files:     {total.get('npc_files', 0)}")
    if do_s and storybook_defs:
        print(f"  Categories:    {total.get('storybook_categories', 0)}")
        print(f"  Entries:       {total.get('storybook_entries', 0)}")
        print(f"  Advancements:  {total.get('storybook_advancements', 0)}")
        print(f"  Story files:   {total.get('storybook_files', 0)}")
    tf = sum(v for k, v in total.items() if k.endswith("_files"))
    print(f"\n  Total files:   {tf}")
    print(f"  Elapsed:       {elapsed:.2f}s\n")
    if not any([quest_defs and do_q, trainer_defs and do_t, npc_defs and do_n, storybook_defs and do_s]):
        print("  Nothing generated. Definition files may be missing.")
        print(f"  Expected locations:")
        for p in (QUEST_DEFS, TRAINER_DEFS, NPC_DEFS, STORYBOOK_DEFS):
            print(f"    {p}")
    else:
        print("  Done.")

if __name__ == "__main__":
    main()
