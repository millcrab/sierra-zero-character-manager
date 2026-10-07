import { useMemo, useState, type ReactNode } from "react";
import { archetypes, attachments, careers, items, skills, specializations, talents } from "../data/canonical";
import { maneuvers } from "../data/maneuvers";
import { motivationKeys, motivationLabels, motivationOptions } from "../data/motivations";
import { GameText } from "./DiceSymbols";
import { ItemDetails } from "./ItemDetails";

type ManualTab = "rules" | "archetypes" | "careers" | "specializations" | "talents" | "skills" | "equipment";

interface ManualEntry {
  id: string;
  title: string;
  subtitle: string;
  searchText: string;
  content: ReactNode;
}

const tabs: Array<[ManualTab, string]> = [
  ["rules", "Rules"],
  ["archetypes", "Archetypes"],
  ["careers", "Careers"],
  ["specializations", "Specs"],
  ["talents", "Talents"],
  ["skills", "Skills"],
  ["equipment", "Equipment"]
];

const skillName = (id: string) => skills.find((skill) => skill.id === id)?.name ?? id;
const specializationName = (id: string) => specializations.find((specialization) => specialization.id === id)?.name ?? id;

function ruleEntries(): ManualEntry[] {
  return [
    {
      id: "what-is-sierra-zero",
      title: "What is Sierra Zero?",
      subtitle: "Setting overview",
      searchText: "Office Exceptional Contingency OEC responders special response team SRT setting",
      content: <><p>Sierra Zero is a Genesys setting about capable people confronting problems outside the assumptions and prepared responses of ordinary institutions. Player characters are Responders recruited into a temporary, interdisciplinary Special Response Team by the Office of Exceptional Contingency.</p><p>OEC works from observed facts, immediate risks, and practical capabilities. It documents, tests, contains, and responds even when a contingency appears impossible.</p></>
    },
    {
      id: "character-creation",
      title: "Character creation",
      subtitle: "Intake sequence",
      searchText: "create archetype career specialization skill XP equipment motivation profile 500 credits",
      content: <ol><li>Choose an archetype.</li><li>Choose a career and starting specialization, then select four career-skill ranks and two starting-specialization skill ranks.</li><li>Spend starting XP on characteristics, skills, and talents.</li><li>Purchase starting equipment with 500 credits.</li><li>Record motivations and complete the agent profile.</li></ol>
    },
    {
      id: "favor",
      title: "Favor",
      subtitle: "Institutional standing and Bureau support",
      searchText: "favor gear requisition success advantage internal social session change controlled restricted advanced",
      content: <><p>Favor measures the Bureau's confidence in an agent. Each agent begins with 10 Favor, or may begin with 0 Favor and gain 10 additional starting XP. The app tracks personal Favor only; it does not track Group Favor.</p><p>At the end of a session, determine the final Favor change at the table and enter only that signed change in the session update.</p><h4>Requisitioning gear</h4><p>Favor cost equals item Rarity plus its price divided by 500, rounded up. Controlled items add no modifier, Restricted items add 2, and Advanced items are reward-only.</p><h4>Internal influence</h4><p>After an internal social check, spend 2 Favor to add one Success or 1 Favor to add one Advantage. Multiple symbols may be purchased, but Favor cannot buy Triumph.</p></>
    },
    {
      id: "motivations",
      title: "Motivations",
      subtitle: "Strength, Flaw, Desire, and Fear",
      searchText: motivationKeys.flatMap((key) => motivationOptions[key].map((option) => `${motivationLabels[key]} ${option.name} ${option.description}`)).join(" "),
      content: <><p>Every character records four Motivation facets. Select one example for each facet, then add the personal detail that makes it specific to the agent.</p>{motivationKeys.map((key) => <div key={key}><h4>{motivationLabels[key]}</h4>{motivationOptions[key].map((option) => <p key={option.id}><strong>{option.name}:</strong> {option.description}</p>)}</div>)}</>
    },
    {
      id: "specializations",
      title: "Specializations and talents",
      subtitle: "Trees, paths, and advancement",
      searchText: "specialization talent tree connector path purchase XP career out universal",
      content: <><p>Every connector in a specialization tree works in both directions. A talent may be purchased when it is an entry talent or connects to an already purchased talent.</p><p>Additional specialization trees use the escalating standard cost formula. Career and universal specializations use the in-career rate; other careers use the out-of-career rate.</p></>
    },
    {
      id: "equipment-access",
      title: "Equipment access",
      subtitle: "Availability and modifications",
      searchText: "ordinary controlled restricted advanced attachments hard points modifications",
      content: <><p>Ordinary and Controlled equipment may be acquired normally. Restricted equipment carries an additional Favor cost. Advanced equipment is obtained only as a reward.</p><p>Attachments are installed on compatible equipment and consume the item's available hard points. Installed modifications appear with the individual item.</p></>
    },
    ...maneuvers.map((maneuver) => ({
      id: `maneuver-${maneuver.id}`,
      title: maneuver.name,
      subtitle: `Maneuver · ${maneuver.summary}`,
      searchText: `${maneuver.summary} ${maneuver.rules}`,
      content: <p><GameText>{maneuver.rules}</GameText></p>
    }))
  ];
}

function entriesFor(tab: ManualTab): ManualEntry[] {
  if (tab === "rules") return ruleEntries();
  if (tab === "archetypes") return archetypes.map((archetype) => ({
    id: archetype.id,
    title: archetype.name,
    subtitle: `${archetype.startingXp} starting XP · Wounds ${archetype.woundBase} + Brawn · Strain ${archetype.strainBase} + Willpower`,
    searchText: `${archetype.description} ${archetype.abilities.map((ability) => `${ability.name} ${ability.rules}`).join(" ")}`,
    content: <><p><GameText>{archetype.description}</GameText></p><p><strong>Characteristics:</strong> {Object.entries(archetype.baseCharacteristics).map(([key, value]) => `${key} ${value}`).join(" · ")}</p>{archetype.abilities.map((ability) => <div key={ability.id}><h4>{ability.name}</h4><p><GameText>{ability.rules}</GameText></p></div>)}</>
  }));
  if (tab === "careers") return careers.map((career) => ({
    id: career.id,
    title: career.name,
    subtitle: career.careerSkillIds.map(skillName).join(" · "),
    searchText: `${career.description ?? ""} ${career.specializationIds.map(specializationName).join(" ")}`,
    content: <><p><GameText>{career.description ?? ""}</GameText></p><p><strong>Career skills:</strong> {career.careerSkillIds.map(skillName).join(", ")}</p><p><strong>Specializations:</strong> {career.specializationIds.map(specializationName).join(", ")}</p></>
  }));
  if (tab === "specializations") return specializations.map((specialization) => ({
    id: specialization.id,
    title: specialization.name,
    subtitle: specialization.careerId ? `${careers.find((career) => career.id === specialization.careerId)?.name ?? "Career"} specialization` : "Universal specialization",
    searchText: `${specialization.description ?? ""} ${specialization.bonusCareerSkillIds.map(skillName).join(" ")} ${specialization.nodes.map((node) => talents.find((talent) => talent.id === node.talentId)?.name ?? "").join(" ")}`,
    content: <><p><GameText>{specialization.description ?? ""}</GameText></p><p><strong>Bonus career skills:</strong> {specialization.bonusCareerSkillIds.map(skillName).join(", ")}</p><p><strong>Talent tree:</strong> {specialization.nodes.map((node) => `${talents.find((talent) => talent.id === node.talentId)?.name ?? node.talentId} (${node.cost} XP)`).join(" · ")}</p></>
  }));
  if (tab === "talents") return talents.map((talent) => ({
    id: talent.id,
    title: talent.name,
    subtitle: `${talent.ranked ? "Ranked · " : ""}${talent.activation}${talent.usage !== "none" ? ` · once per ${talent.usage}` : ""}`,
    searchText: `${talent.rules} ${talent.tags.join(" ")}`,
    content: <><p><GameText>{talent.rules}</GameText></p>{talent.tags.length > 0 && <p><strong>Tags:</strong> {talent.tags.join(", ")}</p>}</>
  }));
  if (tab === "skills") return skills.map((skill) => ({
    id: skill.id,
    title: skill.name,
    subtitle: `${skill.category} skill · ${skill.characteristic}`,
    searchText: `${skill.category} ${skill.characteristic}`,
    content: <p><strong>Linked characteristic:</strong> {skill.characteristic}. <strong>Category:</strong> {skill.category}.</p>
  }));
  return [
    ...items.map((item) => ({
      id: `item-${item.id}`,
      title: item.name,
      subtitle: `${item.category} · $${item.price} · Rarity ${item.rarity} · ${item.access}`,
      searchText: `${item.description} ${item.category} ${item.access} ${item.weapon?.qualities.join(" ") ?? ""}`,
      content: <ItemDetails item={item} />
    })),
    ...attachments.map((attachment) => ({
      id: `attachment-${attachment.id}`,
      title: attachment.name,
      subtitle: `Attachment · ${attachment.hardPoints} HP · $${attachment.price} · Rarity ${attachment.rarity} · ${attachment.access}`,
      searchText: `${attachment.description} ${attachment.effect} ${attachment.useWith ?? ""}`,
      content: <><p><GameText>{attachment.description}</GameText></p><p><GameText>{attachment.effect}</GameText></p>{attachment.useWith && <p><strong>Use with:</strong> {attachment.useWith}</p>}</>
    }))
  ];
}

export function Manual({ onRoster, onReturnToAgent, hasActiveCharacter }: { onRoster: () => void; onReturnToAgent: () => void; hasActiveCharacter: boolean }) {
  const [tab, setTab] = useState<ManualTab>("rules");
  const [query, setQuery] = useState("");
  const entries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entriesFor(tab)
      .filter((entry) => !normalized || `${entry.title} ${entry.subtitle} ${entry.searchText}`.toLowerCase().includes(normalized))
      .sort((left, right) => left.title.localeCompare(right.title));
  }, [query, tab]);

  return <main className="app-shell manual-screen">
    <header className="manual-header"><div><p className="eyebrow">OEC field reference</p><h1>Manual</h1></div><div className="manual-header__actions"><button className="secondary" onClick={onRoster}>Roster</button>{hasActiveCharacter && <button className="primary" onClick={onReturnToAgent}>Agent file</button>}</div></header>
    <nav className="manual-tabs" aria-label="Manual sections">{tabs.map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav>
    <section className="manual-content"><label className="manual-search"><span>Search {tabs.find(([id]) => id === tab)?.[1]}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, rules, tags, and descriptions" /></label><p className="manual-count">{entries.length} indexed entr{entries.length === 1 ? "y" : "ies"}</p><div className="manual-index">{entries.map((entry) => <details key={entry.id} className="manual-entry"><summary><span><strong>{entry.title}</strong><small>{entry.subtitle}</small></span></summary><div className="manual-entry__body">{entry.content}</div></details>)}</div>{entries.length === 0 && <div className="empty-state"><span className="stamp">NO MATCHES</span><p>Try a different name, rule term, tag, or category.</p></div>}</section>
  </main>;
}
