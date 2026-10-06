#!/usr/bin/env python3
"""Extract Sierra Zero canonical records from the supplied omnibus PDFs."""

from __future__ import annotations

import json
import re
import sys
from collections import OrderedDict
from pathlib import Path

import fitz
import pdfplumber


ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / "project_sources"
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "canonical.generated.ts"


def slug(value: str) -> str:
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value


SKILL_CHARACTERISTICS = OrderedDict([
    ("Athletics", "brawn"), ("Brawl", "brawn"), ("Charm", "presence"),
    ("Coercion", "willpower"), ("Computers", "intellect"), ("Cool", "presence"),
    ("Coordination", "agility"), ("Deception", "cunning"), ("Discipline", "willpower"),
    ("Driving", "agility"), ("Gunnery", "agility"), ("Knowledge", "intellect"),
    ("Knowledge (Science)", "intellect"), ("Knowledge (Society)", "intellect"),
    ("Leadership", "presence"), ("Mechanics", "intellect"), ("Medicine", "intellect"),
    ("Melee", "brawn"), ("Melee (Heavy)", "brawn"), ("Melee (Light)", "brawn"),
    ("Negotiation", "presence"), ("Perception", "cunning"), ("Piloting", "agility"),
    ("Ranged", "agility"), ("Ranged (Heavy)", "agility"), ("Ranged (Light)", "agility"),
    ("Resilience", "brawn"), ("Skulduggery", "cunning"), ("Stealth", "agility"),
    ("Streetwise", "cunning"), ("Survival", "cunning"), ("Vigilance", "willpower"),
])


def skill_id(name: str) -> str:
    return slug(name)


def skill_records() -> list[dict]:
    combat = {"Brawl", "Gunnery", "Melee", "Melee (Heavy)", "Melee (Light)", "Ranged", "Ranged (Heavy)", "Ranged (Light)"}
    social = {"Charm", "Coercion", "Deception", "Leadership", "Negotiation"}
    return [{
        "id": skill_id(name), "name": name, "characteristic": characteristic,
        "category": "combat" if name in combat else "social" if name in social else "knowledge" if name.startswith("Knowledge") else "general"
    } for name, characteristic in SKILL_CHARACTERISTICS.items()]


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def clean_source_body(value: str) -> str:
    value = clean_text(value)
    value = re.sub(r"SIERRA ZERO\s*[|\u2022]\s*(?:EQUIPMENT|\d+)", "", value, flags=re.I)
    value = re.sub(r"(?:\s*\u2022){3,}\s*$", "", value)
    return clean_text(value)


def parse_node(page: fitz.Page, rect: fitz.Rect) -> tuple[str, str]:
    lines = [clean_text(line) for line in page.get_text("text", clip=rect).splitlines() if clean_text(line)]
    lines = [line for line in lines if not line.startswith("COST ")]
    title_lines = []
    while lines and (lines[0].upper() == lines[0] or lines[0].startswith("(")):
        title_lines.append(lines.pop(0))
    return clean_text(" ".join(title_lines)).title().replace("(Improved)", "(Improved)").replace("(Supreme)", "(Supreme)"), clean_text(" ".join(lines))


def talent_metadata(name: str, rules: str) -> dict:
    lower = rules.lower()
    usage = "session" if "once per session" in lower else "encounter" if "once per encounter" in lower else "round" if ("once per round" in lower or "once per turn" in lower) else "none"
    activation = "action" if " action" in lower else "maneuver" if "maneuver" in lower else "incidental" if "incidental" in lower else "active" if usage != "none" else "passive"
    ranked = bool(re.search(r"\b(per rank|per additional rank|ranks in|each rank)\b", lower))
    tags = []
    if usage != "none": tags.append(usage)
    if any(word in lower for word in ("combat check", "weapon", "critical injury")): tags.append("combat")
    if any(word in lower for word in ("charm", "coercion", "deception", "leadership", "negotiation", "social check")): tags.append("social")
    modifiers = []
    base = name.split(" (")[0].lower()
    if base == "grit": modifiers.append({"kind": "strainThreshold", "amountPerRank": 1})
    if base == "toughened": modifiers.append({"kind": "woundThreshold", "amountPerRank": 2})
    if base == "enduring": modifiers.append({"kind": "soak", "amountPerRank": 1})
    record = {"id": slug(name), "name": name, "rules": rules, "ranked": ranked, "activation": activation, "usage": usage, "tags": tags}
    if modifiers: record["modifiers"] = modifiers
    return record


def parse_edges(page: fitz.Page, node_ids: dict[tuple[int, int], str]) -> list[list[str]]:
    centers_x = [98.625, 236.875, 375.125, 513.375]
    centers_y = [164, 290, 416, 542, 668]
    edges = set()
    for drawing in page.get_drawings():
        if drawing["type"] != "s" or abs((drawing.get("width") or 0) - 3.2) > 0.2:
            continue
        rect = drawing["rect"]
        if rect.height >= 8 and rect.width < 1:
            col = min(range(4), key=lambda c: abs(centers_x[c] - rect.x0)) + 1
            gap = min(range(4), key=lambda r: abs((222 + 126 * r) - rect.y0)) + 1
            if abs(centers_x[col - 1] - rect.x0) < 2:
                edges.add((node_ids[(gap, col)], node_ids[(gap + 1, col)]))
        elif rect.width >= 8 and rect.height < 1:
            row = min(range(5), key=lambda r: abs(centers_y[r] - rect.y0)) + 1
            gap = min(range(3), key=lambda c: abs((163.25 + 138.25 * c) - rect.x0)) + 1
            if abs(centers_y[row - 1] - rect.y0) < 2:
                edges.add((node_ids[(row, gap)], node_ids[(row, gap + 1)]))
    return [list(edge) for edge in sorted(edges)]


def parse_specializations() -> tuple[list[dict], list[dict], list[dict]]:
    document = fitz.open(SOURCES / "10-Sierra_Zero_Career_Omnibus-1-.pdf")
    xs = [(34, 163.25), (172.25, 301.5), (310.5, 439.75), (448.75, 578)]
    ys = [(106, 222), (232, 348), (358, 474), (484, 600), (610, 726)]
    talents: OrderedDict[str, dict] = OrderedDict()
    careers: OrderedDict[str, dict] = OrderedDict()
    specs = []
    for page_index, page in enumerate(document):
        header = page.get_text("text", clip=fitz.Rect(0, 0, 612, 105))
        first = clean_text(header.splitlines()[0])
        universal = " Universal Talent Tree" in first
        if universal:
            name = first.replace(" Universal Talent Tree", "")
            career_name = None
            skill_match = re.search(r"Universal Specialization Skills: (.+)", header)
        else:
            match = re.match(r"(.+?): (.+?) Talent Tree", first)
            if not match:
                raise ValueError(f"Cannot parse specialization header on page {page_index + 1}: {first}")
            career_name, name = match.groups()
            skill_match = re.search(r"(?:.+? Bonus Career Skills|Bonus Career Skills): (.+)", header)
            career_match = re.search(r"Career Skills: (.+)", header)
            career_id = slug(career_name)
            if career_id not in careers:
                career_skills = [skill_id(x.strip()) for x in career_match.group(1).split(",")]
                careers[career_id] = {"id": career_id, "name": career_name, "description": None, "careerSkillIds": career_skills, "specializationIds": []}
        spec_id = slug(name)
        node_ids = {}
        nodes = []
        title_counts = {}
        parsed = {}
        for row, (y0, y1) in enumerate(ys, 1):
            for col, (x0, x1) in enumerate(xs, 1):
                title, rules = parse_node(page, fitz.Rect(x0, y0, x1, y1))
                talent_id = slug(title)
                prefix = "sf" if spec_id == "special-forces" else spec_id
                node_id = f"{prefix}-{row}-{col}"
                node_ids[(row, col)] = node_id
                title_counts[title] = title_counts.get(title, 0) + 1
                parsed[(row, col)] = (title, rules, talent_id, node_id)
                current = talent_metadata(title, rules)
                if talent_id not in talents or len(rules) > len(talents[talent_id]["rules"]): talents[talent_id] = current
        for (row, col), (title, rules, talent_id, node_id) in parsed.items():
            if title_counts[title] > 1: talents[talent_id]["ranked"] = True
            nodes.append({"id": node_id, "talentId": talent_id, "row": row, "column": col, "cost": row * 5})
        bonus = [skill_id(x.strip()) for x in skill_match.group(1).split(",")]
        career_id = None if universal else slug(career_name)
        spec = {"id": spec_id, "name": name, "careerId": career_id, "description": None, "bonusCareerSkillIds": bonus,
                "nodes": nodes, "edges": parse_edges(page, node_ids), "entryNodeIds": [node_ids[(1, c)] for c in range(1, 5)]}
        specs.append(spec)
        if career_id: careers[career_id]["specializationIds"].append(spec_id)
    return list(talents.values()), list(careers.values()), specs


def named_skills(text: str) -> list[str]:
    found = []
    aliases = sorted(SKILL_CHARACTERISTICS, key=len, reverse=True)
    for name in aliases:
        if re.search(rf"\b{re.escape(name)}\b", text, re.I) and skill_id(name) not in found:
            found.append(skill_id(name))
    return found


def parse_archetype_starting(instructions: str) -> tuple[dict[str, int], list[str], int, int]:
    lower = instructions.lower()
    fixed: dict[str, int] = {}
    choices: list[str] = []
    count = 0
    rank = 1
    mentioned = named_skills(instructions)
    noncombat = [r["id"] for r in skill_records() if r["category"] != "combat"]
    all_skills = [r["id"] for r in skill_records()]
    if "choose one noncombat skill" in lower:
        choices, count, rank = noncombat, 1, 2 if "two ranks" in lower else 1
    elif "choose two different noncombat skills" in lower:
        choices, count = noncombat, 2
    elif "choose two different noncareer skills" in lower:
        choices, count = all_skills, 2
    elif "choose any one skill" in lower:
        choices, count = all_skills, 1
    elif "complete both construction choices" in lower:
        choices, count = mentioned, 2
    elif "one rank in both" in lower:
        for sid in mentioned[:2]: fixed[sid] = 1
    elif "and one rank in either" in lower:
        if mentioned: fixed[mentioned[0]] = 1
        choices, count = mentioned[1:], 1
    elif " or " in lower or len(mentioned) > 1:
        choices, count = mentioned, 1
    elif mentioned:
        fixed[mentioned[0]] = 1
    return fixed, choices, count, rank


def parse_archetypes() -> list[dict]:
    document = fitz.open(SOURCES / "12-Sierra_Zero_Archetype_Omnibus-1-.pdf")
    records = []
    char_keys = ["brawn", "agility", "intellect", "cunning", "willpower", "presence"]
    for page in list(document)[2:]:
        headings = []
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                for span in line["spans"]:
                    if abs(span["size"] - 15) < .2 and "Bold" in span["font"]:
                        headings.append((span["bbox"][1], span["text"]))
        headings.sort()
        for index, (y0, name) in enumerate(headings):
            y1 = headings[index + 1][0] - 4 if index + 1 < len(headings) else 754
            clip = fitz.Rect(45, y0 - 2, 570, y1)
            text = page.get_text("text", clip=clip)
            values = []
            ability_starts = []
            start_header_y = None
            for block in page.get_text("dict", clip=clip)["blocks"]:
                for line in block.get("lines", []):
                    for span in line["spans"]:
                        sy = span["bbox"][1]
                        if abs(span["size"] - 13) < .2 and span["text"].isdigit(): values.append((span["bbox"][0], int(span["text"])))
                        if span["text"] == "STARTING SKILLS": start_header_y = span["bbox"][3]
                        if start_header_y and sy > start_header_y and "Bold" in span["font"] and span["bbox"][0] < 58 and span["text"] != "STARTING SKILLS":
                            ability_starts.append((sy, span["text"]))
            values = [value for _, value in sorted(values)[:6]]
            if len(values) != 6: raise ValueError(f"Characteristic parse failed for {name}: {values}")
            threshold_match = re.search(r"WOUND THRESHOLD\s+(\d+)\s*\+ Brawn\s+STRAIN THRESHOLD\s+(\d+)\s*\+ Willpower\s+STARTING XP\s+(\d+)", clean_text(text))
            if not threshold_match: raise ValueError(f"Threshold parse failed for {name}")
            wound, strain, xp = map(int, threshold_match.groups())
            heading_end = y0 + 19
            desc_text = page.get_text("text", clip=fitz.Rect(45, heading_end, 570, y0 + 70))
            description = clean_source_body(desc_text)
            description = re.sub(r"\s+Brawn Agility Intellect Cunning Willpower Presence.*$", "", description)
            first_ability_y = min((y for y, _ in ability_starts), default=y1 - 2)
            instructions = clean_text(page.get_text("text", clip=fitz.Rect(45, start_header_y or first_ability_y, 570, first_ability_y)))
            abilities_text = clean_source_body(page.get_text("text", clip=fitz.Rect(45, first_ability_y, 570, y1)))
            ability_name = clean_text(" ".join(t for y, t in ability_starts if abs(y - first_ability_y) < 2)).rstrip(".") or "Archetype Features"
            fixed, choices, count, choice_rank = parse_archetype_starting(instructions)
            groups = []
            if name == "Ghost":
                groups = [
                    {"id": "erasure", "label": "Erasure", "eligibleSkillIds": ["knowledge", "negotiation", "cool", "deception", "skulduggery", "streetwise"], "choiceCount": 1, "rank": 1, "grantsCareerSkill": True,
                     "options": [{"id": f"{slug(track)}-{skill_id(skill)}", "label": f"{track} - {skill}", "skillId": skill_id(skill), "careerSkillIds": [skill_id(skill)]}
                                 for track, pair in [("Institutional", ["Knowledge", "Negotiation"]), ("Presumed Dead", ["Cool", "Deception"]), ("Self-Erased", ["Skulduggery", "Streetwise"])] for skill in pair]},
                    {"id": "tradecraft", "label": "Tradecraft", "eligibleSkillIds": ["computers", "deception", "stealth"], "choiceCount": 1, "rank": 2, "grantsCareerSkill": True,
                     "options": [{"id": f"{slug(track)}-{skill_id(skill)}", "label": f"{track} - {skill}", "skillId": skill_id(skill), "careerSkillIds": [skill_id(skill)]}
                                 for track, skill in [("Digital", "Computers"), ("Social", "Deception"), ("Physical", "Stealth")]]},
                ]
                choices, count = sorted(set(sum((g["eligibleSkillIds"] for g in groups), []))), 2
            elif name == "Scion":
                inheritance = [("Public Office", ["Knowledge", "Negotiation"]), ("Commerce", ["Knowledge", "Streetwise"]),
                               ("Security", ["Coercion", "Vigilance"]), ("Media", ["Charm", "Deception"]),
                               ("Faith or Civic Life", ["Discipline", "Leadership"]), ("Underworld", ["Skulduggery", "Streetwise"])]
                groups = [
                    {"id": "inheritance", "label": "Inheritance network and ranked skill", "eligibleSkillIds": sorted(set(skill_id(skill) for _, pair in inheritance for skill in pair)), "choiceCount": 1, "rank": 1, "grantsCareerSkill": True,
                     "options": [{"id": f"{slug(track)}-{skill_id(skill)}", "label": f"{track} - {skill}", "skillId": skill_id(skill), "careerSkillIds": [skill_id(x) for x in pair]}
                                 for track, pair in inheritance for skill in pair]},
                    {"id": "claim", "label": "Claim", "eligibleSkillIds": ["charm", "leadership", "coercion"], "choiceCount": 1, "rank": 1, "grantsCareerSkill": True,
                     "options": [{"id": slug(label), "label": f"{label} - {skill}", "skillId": skill_id(skill), "careerSkillIds": [skill_id(skill)]}
                                 for label, skill in [("Affection", "Charm"), ("Authority", "Leadership"), ("Leverage", "Coercion")]]},
                ]
                choices, count = sorted(set(sum((g["eligibleSkillIds"] for g in groups), []))), 2
            elif count:
                groups = [{"id": "choice", "label": "Archetype skill", "eligibleSkillIds": choices, "choiceCount": count, "rank": choice_rank,
                           "grantsCareerSkill": name == "Prodigy", "excludesCareerSkills": name == "Everyman"}]
            records.append({
                "id": slug(name), "name": name, "description": description,
                "baseCharacteristics": dict(zip(char_keys, values)), "startingXp": xp,
                "woundBase": wound, "strainBase": strain,
                "startingSkillChoiceIds": choices, "startingSkillChoiceCount": count,
                "startingSkillChoiceRank": choice_rank, "fixedStartingSkillRanks": fixed,
                "startingSkillInstructions": instructions,
                "startingSkillGroups": groups,
                "abilities": [{"id": f"{slug(name)}-features", "name": ability_name, "rules": abilities_text, "tags": []}]
            })
    return records


def split_name_source(cell: str) -> tuple[str, str]:
    lines = [clean_text(x) for x in (cell or "").splitlines() if clean_text(x)]
    source = ""
    if lines and re.match(r"^(CRB|EPG|SotB)\b", lines[-1]): source = lines.pop()
    return clean_text(" ".join(lines)), source


def int_value(value: str) -> int:
    value = (value or "0").replace(",", "").replace("+", "").strip()
    match = re.search(r"-?\d+", value)
    return int(match.group()) if match else 0


def parse_items() -> tuple[list[dict], list[dict]]:
    items = []
    attachment_rows = []
    with pdfplumber.open(SOURCES / "11-Sierra_Zero_Item_Guide-1-.pdf") as document:
        for page_number, page in enumerate(document.pages, 1):
            advanced = page_number >= 16
            for table in page.extract_tables():
                if not table or not table[0]: continue
                header = [clean_text(x or "") for x in table[0]]
                kind = header[0]
                if kind not in {"Weapon", "Armor", "Item", "Attachment"}: continue
                for row in table[1:]:
                    if not row or not row[0]: continue
                    name, source = split_name_source(row[0])
                    if not name: continue
                    rarity_cell = row[header.index("Rar")]
                    rarity = int_value(rarity_cell)
                    access = "advanced" if advanced else "restricted" if "R" in (rarity_cell or "") else "ordinary"
                    if kind == "Attachment":
                        attachment_rows.append({"id": slug(name), "name": name, "description": "", "price": int_value(row[header.index("Cost")]),
                            "rarity": rarity, "access": access, "hardPoints": int_value(row[header.index("HP")]), "eligibleItemIds": [],
                            "useWith": clean_text(row[header.index("Use With")] or ""), "effect": "", "source": source})
                        continue
                    record = {"id": slug(name), "name": name, "category": "gear" if kind == "Item" else kind.lower(), "description": "",
                              "price": int_value(row[header.index("Cost")]), "rarity": rarity, "access": access,
                              "encumbrance": int_value(row[header.index("Enc")]), "hardPoints": int_value(row[header.index("HP")]) if "HP" in header else 0,
                              "source": source}
                    if kind == "Weapon":
                        damage_raw = clean_text(row[header.index("Dam")] or "0")
                        damage = int_value(damage_raw) if not damage_raw.startswith("+") else damage_raw
                        qualities = [clean_text(x) for x in (row[header.index("Qualities")] or "").replace("\n", " ").split(",") if clean_text(x) and clean_text(x) != "-"]
                        record["weapon"] = {"skillId": skill_id(clean_text(row[header.index("Skill")] or "Ranged")), "damage": damage,
                                            "critical": int_value(row[header.index("Crit")]), "range": clean_text(row[header.index("Range")] or ""), "qualities": qualities}
                    elif kind == "Armor":
                        record["armor"] = {"defense": int_value(row[header.index("Def")]), "soak": int_value(row[header.index("Soak")])}
                    items.append(record)
        text = "\n".join(page.extract_text() or "" for page in document.pages)
    names = sorted({r["name"] for r in items + attachment_rows}, key=len, reverse=True)
    pattern = re.compile(r"(?m)^(" + "|".join(re.escape(name) for name in names) + r")\.\s+")
    matches = list(pattern.finditer(text))
    descriptions = {}
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        body = clean_source_body(text[match.end():end])
        if len(body) > len(descriptions.get(match.group(1), "")): descriptions[match.group(1)] = body
    for record in items:
        record["description"] = descriptions.get(record["name"], record["name"])
    weapon_ids = [r["id"] for r in items if r["category"] == "weapon"]
    armor_ids = [r["id"] for r in items if r["category"] == "armor"]
    by_id = {r["id"]: r for r in items}
    for record in attachment_rows:
        body = descriptions.get(record["name"], record["name"])
        record["description"] = body
        effect_match = re.search(r"Effect:\s*(.+)", body, re.I)
        record["effect"] = effect_match.group(1) if effect_match else body
        use = record["useWith"].lower()
        eligible = []
        if "armor" in use and "weapon" not in use: eligible = armor_ids
        elif "any weapon" in use: eligible = weapon_ids
        elif "ranged weapon" in use: eligible = [i for i in weapon_ids if by_id[i].get("weapon", {}).get("skillId", "").startswith(("ranged", "gunnery"))]
        elif "close combat" in use or "melee" in use: eligible = [i for i in weapon_ids if by_id[i].get("weapon", {}).get("skillId", "").startswith(("melee", "brawl"))]
        elif "pistol" in use: eligible = [i for i in weapon_ids if "pistol" in by_id[i]["name"].lower() or "hand cannon" in by_id[i]["name"].lower()]
        else: eligible = weapon_ids if "weapon" in use else armor_ids if "armor" in use else []
        record["eligibleItemIds"] = eligible
    return items, attachment_rows


def emit(name: str, value: object, type_name: str) -> str:
    return f"export const {name}: {type_name}[] = " + json.dumps(value, indent=2, ensure_ascii=True) + ";\n\n"


def main() -> None:
    talents, careers, specializations = parse_specializations()
    archetypes = parse_archetypes()
    items, attachments = parse_items()
    content = """// Generated by scripts/import_canonical.py from the approved Sierra Zero omnibus PDFs.\n// Do not hand-edit this file; update the sources or importer and regenerate it.\n\nimport type { AttachmentRecord, ArchetypeRecord, CareerRecord, ItemRecord, SkillRecord, SpecializationRecord, TalentRecord } from \"../types\";\n\n"""
    content += emit("skills", skill_records(), "SkillRecord")
    content += emit("talents", talents, "TalentRecord")
    content += emit("specializations", specializations, "SpecializationRecord")
    content += emit("careers", careers, "CareerRecord")
    content += emit("archetypes", archetypes, "ArchetypeRecord")
    content += emit("items", items, "ItemRecord")
    content += emit("attachments", attachments, "AttachmentRecord")
    content += "export const specialForces = specializations.find((record) => record.id === \"special-forces\")!;\n"
    content += "export const canonicalData = { skills, talents, specializations, careers, archetypes, items, attachments };\n"
    OUT.write_text(content, encoding="utf-8")
    print(json.dumps({"skills": len(skill_records()), "talents": len(talents), "archetypes": len(archetypes), "careers": len(careers),
                      "specializations": len(specializations), "nodes": sum(len(x["nodes"]) for x in specializations),
                      "edges": sum(len(x["edges"]) for x in specializations), "items": len(items), "attachments": len(attachments)}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"import failed: {exc}", file=sys.stderr)
        raise
