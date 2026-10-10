import { useEffect, useMemo, useState } from "react";
import { archetypes, attachments, careers, items, skills, specializations, talents } from "./data/canonical";
import { maneuvers } from "./data/maneuvers";
import {
  applySessionUpdate,
  applyStartingSkillSelections,
  applyStrain,
  applyWounds,
  availableXp,
  canAcquireNormally,
  canIncreaseCharacteristic,
  canIncreaseSkill,
  canInstallAttachment,
  createCharacterDraft,
  decreaseCharacteristic,
  decreaseSkill,
  defenses,
  derivedCharacteristics,
  increaseCharacteristic,
  increaseSkill,
  itemFavorCost,
  newEncounter,
  nextCharacteristicCost,
  nextSkillRankCost,
  nextTurn,
  remainingHardPoints,
  removeAttachmentFromDraft,
  removeInventoryFromDraft,
  setExtraManeuver,
  setItemEquipped,
  skillPool,
  skillRank,
  specializationAcquisitionCost,
  talentRanks,
  thresholds
} from "./engine/rules";
import { TalentTree } from "./components/TalentTree";
import { DicePoolDisplay, GameText } from "./components/DiceSymbols";
import { ItemDetails } from "./components/ItemDetails";
import { Manual } from "./components/Manual";
import { SymbolSpendDialog } from "./components/SymbolSpendDialog";
import { ArchetypeAbilities } from "./components/ArchetypeAbilities";
import { findMotivationOption, motivationKeys, motivationLabels, motivationOptions } from "./data/motivations";
import { deleteCharacter, listCharacters, saveCharacter, saveCharacters } from "./storage/db";
import { mergeImportedCharacters, parseBackup, serializeBackup } from "./storage/transfer";
import { activateWaitingWorker, UPDATE_READY_EVENT } from "./pwa";
import { useSwipeTabs } from "./hooks/useSwipeTabs";
import type { AcquisitionPayment, Character, CharacteristicKey, MotivationKey, TalentRecord } from "./types";
import packageJson from "../package.json";
import "./styles.css";

type View = "home" | "manual" | "create" | "summary" | "play" | "advance";
type CharacterUpdater = (updater: (character: Character) => Character) => void;
type PlayTab = "dashboard" | "combat" | "social" | "skills" | "gear" | "spec";
type AdvanceTab = "update" | "specs" | "skills" | "profile";

interface SierraHistoryState {
  sierraZero: true;
  view: View;
  activeId: string | null;
  creationStep?: number;
  playTab?: PlayTab;
  advanceTab?: AdvanceTab;
}

const views: View[] = ["home", "manual", "create", "summary", "play", "advance"];
const playTabs: PlayTab[] = ["dashboard", "combat", "social", "skills", "gear", "spec"];
const advanceTabs: AdvanceTab[] = ["update", "specs", "skills", "profile"];

function currentHistoryState(): SierraHistoryState | null {
  const state = window.history.state as Partial<SierraHistoryState> | null;
  if (!state?.sierraZero || !state.view || !views.includes(state.view)) return null;
  return { ...state, sierraZero: true, view: state.view, activeId: typeof state.activeId === "string" ? state.activeId : null };
}

function pushHistoryState(patch: Partial<SierraHistoryState>) {
  const current = currentHistoryState() ?? { sierraZero: true, view: "home", activeId: null };
  window.history.pushState({ ...current, ...patch, sierraZero: true }, "");
}

const characteristicKeys: CharacteristicKey[] = ["brawn", "agility", "intellect", "cunning", "willpower", "presence"];

const findArchetype = (id: string) => archetypes.find((record) => record.id === id)!;
const findCareer = (id: string) => careers.find((record) => record.id === id)!;
const findSpecialization = (id: string) => specializations.find((record) => record.id === id)!;
const findItem = (id: string) => items.find((record) => record.id === id)!;
const skillName = (id: string) => skills.find((record) => record.id === id)?.name ?? id;

function downloadBackup(characters: Character[], filename: string) {
  const url = URL.createObjectURL(new Blob([serializeBackup(characters)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function characterBackupFilename(character: Character, suffix = "backup") {
  const slug = character.profile.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "sierra-zero-agent";
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `${slug}-${stamp}-${suffix}.json`;
}

export default function App() {
  const [coverVisible, setCoverVisible] = useState(true);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => currentHistoryState()?.activeId ?? null);
  const [view, setView] = useState<View>(() => currentHistoryState()?.view ?? "home");
  const [ready, setReady] = useState(false);
  const [transferNotice, setTransferNotice] = useState("");
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    listCharacters().then((records) => {
      setCharacters(records.sort((a, b) => b.metadata.updatedAt.localeCompare(a.metadata.updatedAt)));
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const announce = () => setUpdateReady(true);
    window.addEventListener(UPDATE_READY_EVENT, announce);
    return () => window.removeEventListener(UPDATE_READY_EVENT, announce);
  }, []);

  useEffect(() => {
    if (!currentHistoryState()) {
      window.history.replaceState({ sierraZero: true, view, activeId } satisfies SierraHistoryState, "");
    }
    const restoreRoute = (event: PopStateEvent) => {
      const state = event.state as Partial<SierraHistoryState> | null;
      if (state?.sierraZero && state.view && views.includes(state.view)) {
        setActiveId(typeof state.activeId === "string" ? state.activeId : null);
        setView(state.view);
      } else {
        setActiveId(null);
        setView("home");
      }
    };
    window.addEventListener("popstate", restoreRoute);
    return () => window.removeEventListener("popstate", restoreRoute);
  }, []);

  const navigate = (nextView: View, nextActiveId: string | null = activeId) => {
    if (nextView === view && nextActiveId === activeId) return;
    window.history.pushState({ sierraZero: true, view: nextView, activeId: nextActiveId } satisfies SierraHistoryState, "");
    setActiveId(nextActiveId);
    setView(nextView);
  };

  const active = characters.find((character) => character.id === activeId) ?? null;
  const updateActive = (updater: (character: Character) => Character) => {
    if (!active) return;
    const updated = updater(structuredClone(active));
    updated.metadata.updatedAt = new Date().toISOString();
    setCharacters((current) => current.map((character) => character.id === updated.id ? updated : character));
    void saveCharacter(updated);
  };
  const beginCreation = () => {
    const draft = createCharacterDraft();
    setCharacters((current) => [draft, ...current]);
    navigate("create", draft.id);
    void saveCharacter(draft);
  };

  const importBackup = async (fileList?: FileList | File[]) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;
    try {
      const imported = (await Promise.all(files.map(async (file) => parseBackup(await file.text())))).flat();
      const merged = mergeImportedCharacters(characters, imported);
      await saveCharacters(merged);
      setCharacters(merged);
      const uniqueCount = new Set(imported.map((character) => character.id)).size;
      setTransferNotice(`Read ${files.length} backup file${files.length === 1 ? "" : "s"} and kept the newest version of ${uniqueCount} agent${uniqueCount === 1 ? "" : "s"}.`);
    } catch (error) {
      setTransferNotice(error instanceof Error ? error.message : "Import failed.");
    }
  };

  const applySessionUpdateWithBackup = (xpChange: number, favorChange: number) => {
    if (!active) return;
    const updated = applySessionUpdate(structuredClone(active), xpChange, favorChange);
    updated.metadata.updatedAt = new Date().toISOString();
    setCharacters((current) => current.map((character) => character.id === updated.id ? updated : character));
    void saveCharacter(updated);
    downloadBackup([updated], characterBackupFilename(updated, "session"));
  };

  const removeCharacter = async (id: string) => {
    await deleteCharacter(id);
    setCharacters((current) => current.filter((character) => character.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setView("home");
      window.history.replaceState({ sierraZero: true, view: "home", activeId: null } satisfies SierraHistoryState, "");
    }
  };

  if (coverVisible) return <CoverScreen onEnter={() => setCoverVisible(false)} />;
  if (!ready) return <main className="loading">Opening personnel files...</main>;
  if (view === "manual") return <><UpdateBanner visible={updateReady} /><Manual hasActiveCharacter={Boolean(active)} onRoster={() => navigate("home", null)} onReturnToAgent={() => navigate("summary", activeId)} /></>;
  if (view === "home" || !active) return <><UpdateBanner visible={updateReady} /><Home characters={characters} beginCreation={beginCreation} notice={transferNotice} backup={() => downloadBackup(characters, "sierra-zero-roster-backup.json")} importBackup={importBackup} deleteCharacter={removeCharacter} openManual={() => navigate("manual", null)} open={(character) => {
    navigate(character.status === "draft" ? "create" : "summary", character.id);
  }} /></>;

  const archetype = findArchetype(active.build.archetypeId);
  const career = findCareer(active.build.careerId);
  return <><UpdateBanner visible={updateReady} /><main className="app-shell character-shell">
    <header className="character-header">
      <div className="header-actions"><button className="text-button" type="button" onClick={() => navigate("home", null)}>Roster</button><button className="text-button" type="button" onClick={() => navigate("manual")}>Manual</button></div>
      <div><p className="file-code">SZ / RESPONDER FILE</p><h1>{active.profile.name}</h1></div>
      <span className="xp-chip">{availableXp(active)} XP</span>
    </header>
    {view === "create" && <CreationView character={active} onUpdate={updateActive} onComplete={() => {
      updateActive((character) => ({ ...character, status: "complete" })); navigate("summary", active.id);
    }} />}
    {view === "summary" && <section className="content-stack">
      <div className="identity-panel"><Portrait character={active} large /><div><p className="eyebrow">Active responder</p><h2>{active.profile.name}</h2><p>{archetype.name} · {career.name} · {active.build.specializationIds.map((id) => findSpecialization(id).name).join(" / ")}</p></div></div>
      <StatusGrid character={active} />
      <section className="paper-panel"><p className="file-code">ARCHETYPE CAPABILITIES</p><ArchetypeAbilities archetype={archetype} /></section>
      <MotivationSummary character={active} />
      <div className="export-actions">
        <PdfExportButton character={active} />
        <button className="secondary" onClick={() => downloadBackup([active], characterBackupFilename(active))}>Export backup file</button>
      </div>
    </section>}
    {view === "play" && <PlayView character={active} onUpdate={updateActive} onSummary={() => navigate("summary")} />}
    {view === "advance" && <AdvanceView character={active} onUpdate={updateActive} onSessionUpdate={applySessionUpdateWithBackup} onSummary={() => navigate("summary")} />}
    {active.status === "complete" && <nav className="bottom-nav" aria-label="Character mode">
      <button className={view === "summary" ? "active" : ""} onClick={() => navigate("summary")}>Summary</button>
      <button className={view === "play" ? "active" : ""} onClick={() => navigate("play")}>Play</button>
      <button className={view === "advance" ? "active" : ""} onClick={() => navigate("advance")}>Advance</button>
    </nav>}
  </main></>;
}

function CoverScreen({ onEnter }: { onEnter: () => void }) {
  return <button className="cover-screen" type="button" onClick={onEnter} aria-label="Open Sierra Zero Character Manager"><img src={`${import.meta.env.BASE_URL}sierra-zero-cover.png`} alt="Sierra Zero: A Genesys setting of paranormal crisis response" /><span>Tap anywhere to open the files</span></button>;
}

function PdfExportButton({ character }: { character: Character }) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const exportPdf = async () => {
    setExporting(true);
    setError("");
    try {
      const { downloadCharacterSheetPdf } = await import("./export/characterSheetPdf");
      await downloadCharacterSheetPdf(character);
    }
    catch { setError("The PDF could not be created. Try exporting again."); }
    finally { setExporting(false); }
  };
  return <><button className="primary" disabled={exporting} onClick={() => void exportPdf()}>{exporting ? "Preparing PDF..." : "Export character sheet PDF"}</button>{error && <span className="export-error" role="alert">{error}</span>}</>;
}

function UpdateBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <aside className="update-banner" role="status"><div><strong>A Sierra Zero update is ready.</strong><span>Your characters will remain on this device.</span></div><button className="primary" onClick={() => void activateWaitingWorker()}>Update and restart</button></aside>;
}

function Home({ characters, beginCreation, open, backup, importBackup, deleteCharacter: removeCharacter, openManual, notice }: { characters: Character[]; beginCreation: () => void; open: (character: Character) => void; backup: () => void; importBackup: (files?: FileList | File[]) => void; deleteCharacter: (id: string) => Promise<void>; openManual: () => void; notice: string }) {
  const [deleting, setDeleting] = useState<Character | null>(null);
  return <main className="app-shell home-screen">
    <header className="masthead"><div className="mark">SZ</div><div><p className="eyebrow">Office of Exceptional Contingency</p><h1>Sierra Zero</h1><p className="deck">Character Manager</p></div></header>
    <section className="roster"><div className="section-heading"><div><p className="file-code">FILE INDEX / LOCAL</p><h2>Agent roster</h2></div><div className="roster-primary-actions"><button className="secondary" onClick={openManual}>Open manual</button><button className="primary" onClick={beginCreation}>Create new agent</button></div></div><div className="roster-tools"><button className="secondary" disabled={!characters.length} onClick={backup}>Backup all characters</button><label className="secondary file-button">Import backup<input type="file" multiple accept="application/json,.json" onChange={(event) => { importBackup(event.target.files ?? undefined); event.target.value = ""; }} /></label></div>{notice && <p className="transfer-notice" role="status">{notice}</p>}
      {characters.length === 0 ? <div className="empty-state"><span className="stamp">NO ACTIVE FILES</span><p>Create the first local character record. Drafts and completed agents remain on this device.</p></div> :
        <div className="dossier-list">{characters.map((character) => <article className="dossier-card" key={character.id}><button type="button" className="dossier-open" onClick={() => open(character)}><Portrait character={character} /><span><span className="file-code">{character.status === "draft" ? "DRAFT" : "ACTIVE RESPONDER"}</span><strong>{character.profile.name}</strong><small>{findArchetype(character.build.archetypeId)?.name} / {findCareer(character.build.careerId)?.name}</small></span></button><button type="button" className="dossier-delete" onClick={() => setDeleting(character)} aria-label={`Delete ${character.profile.name}`}>Delete</button></article>)}</div>}
    </section><footer className="app-version">Sierra Zero Character Manager · v{packageJson.version}</footer>{deleting && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleting(null); }}><section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-character-title"><p className="eyebrow">Permanent file action</p><h2 id="delete-character-title">Delete {deleting.profile.name}?</h2><p>This removes the character and its portrait from this device. This cannot be undone unless the character exists in a backup.</p><div className="dialog-actions"><button className="secondary" onClick={() => setDeleting(null)}>Cancel</button><button className="danger" onClick={() => { const id = deleting.id; setDeleting(null); void removeCharacter(id); }}>Delete character</button></div></section></div>}
  </main>;
}

function Portrait({ character, large = false }: { character: Character; large?: boolean }) {
  const className = large ? "portrait-large" : "portrait-placeholder";
  return character.profile.portraitDataUrl
    ? <img className={`${className} portrait-image`} src={character.profile.portraitDataUrl} style={{ objectPosition: `50% ${character.profile.portraitFocusY ?? 50}%` }} alt="" />
    : <span className={className}>{character.profile.name.slice(0, 1).toUpperCase()}</span>;
}

function CreationView({ character, onUpdate, onComplete }: { character: Character; onUpdate: (updater: (character: Character) => Character) => void; onComplete: () => void }) {
  const [step, setStep] = useState(() => {
    const saved = currentHistoryState()?.creationStep;
    return typeof saved === "number" && saved >= 1 && saved <= 6 ? saved : 1;
  });
  useEffect(() => {
    const restoreStep = (event: PopStateEvent) => {
      const state = event.state as Partial<SierraHistoryState> | null;
      if (state?.view !== "create") return;
      setStep(typeof state.creationStep === "number" && state.creationStep >= 1 && state.creationStep <= 6 ? state.creationStep : 1);
    };
    window.addEventListener("popstate", restoreStep);
    return () => window.removeEventListener("popstate", restoreStep);
  }, []);
  const goToStep = (nextStep: number) => {
    pushHistoryState({ view: "create", activeId: character.id, creationStep: nextStep });
    setStep(nextStep);
  };
  const archetype = findArchetype(character.build.archetypeId);
  const career = findCareer(character.build.careerId);
  const specialization = findSpecialization(character.build.specializationIds[0]);
  const xp = availableXp(character);
  const chooseArchetype = (id: string) => onUpdate((draft) => {
    draft.build.archetypeId = id;
    draft.build.purchases.characteristicRanks = {};
    draft.build.purchases.skillRanks = {};
    draft.build.purchases.talentNodeIds = [];
    draft.build.startingSkillSelections.archetypeSkillIds = [];
    draft.build.startingSkillSelections.archetypeSkillGroups = {};
    return applyStartingSkillSelections(draft, draft.build.startingSkillSelections);
  });
  const chooseCareer = (id: string) => onUpdate((draft) => {
    const nextCareer = findCareer(id);
    draft.build.careerId = id;
    draft.build.specializationIds = [nextCareer.specializationIds[0]];
    draft.build.purchases.talentNodeIds = [];
    draft.build.purchases.skillRanks = {};
    draft.build.purchases.specializationIds = [];
    draft.build.startingSkillSelections.careerSkillIds = [];
    draft.build.startingSkillSelections.specializationSkillIds = [];
    return applyStartingSkillSelections(draft, draft.build.startingSkillSelections);
  });
  const chooseSpecialization = (id: string) => onUpdate((draft) => {
    draft.build.specializationIds = [id];
    draft.build.purchases.talentNodeIds = [];
    draft.build.purchases.skillRanks = {};
    draft.build.startingSkillSelections.specializationSkillIds = [];
    return applyStartingSkillSelections(draft, draft.build.startingSkillSelections);
  });
  return <section className="content-stack creation-flow">
    <div className="progress-line"><span style={{ width: `${step * (100 / 6)}%` }} /></div><p className="file-code">INTAKE / STEP {step} OF 6</p>
    {step === 1 && <section className="paper-panel selection-card selected"><p className="eyebrow">Archetype</p><label className="field-label">Choose archetype<select value={archetype.id} onChange={(event) => chooseArchetype(event.target.value)}>{archetypes.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select></label><h2>{archetype.name}</h2><p><GameText>{archetype.description}</GameText></p><CharacteristicStrip values={archetype.baseCharacteristics} /><p><strong>{archetype.startingXp} starting XP</strong> · Wounds {archetype.woundBase} + Brawn · Strain {archetype.strainBase} + Willpower</p><p><GameText>{archetype.startingSkillInstructions ?? ""}</GameText></p><ArchetypeAbilities archetype={archetype} /></section>}
    {step === 2 && <section className="paper-panel selection-card selected"><p className="eyebrow">Career and starting specialization</p><div className="update-fields"><label className="field-label">Career<select value={career.id} onChange={(event) => chooseCareer(event.target.value)}>{careers.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select></label><label className="field-label">Starting specialization<select value={specialization.id} onChange={(event) => chooseSpecialization(event.target.value)}>{career.specializationIds.map((id) => <option key={id} value={id}>{findSpecialization(id).name}</option>)}</select></label></div><p className="skill-string">Career skills: {career.careerSkillIds.map(skillName).join(", ")}</p><p className="skill-string">Bonus career skills: {specialization.bonusCareerSkillIds.map(skillName).join(", ")}</p><StartingSkillChoices character={character} onUpdate={onUpdate} /></section>}
    {step === 3 && <StartingXpPanel character={character} onUpdate={onUpdate} />}
    {step === 4 && <GearPanel character={character} onUpdate={onUpdate} creation />}
    {step === 5 && <MotivationEditor character={character} onUpdate={onUpdate} />}
    {step === 6 && <section className="content-stack review-stack"><ProfileEditor character={character} onUpdate={onUpdate} /><section className="paper-panel"><p className="eyebrow">Review</p><h2>Resulting agent</h2><CharacteristicStrip values={derivedCharacteristics(character)} /><StatusGrid character={character} /><p><strong>{xp} XP unspent.</strong> Unspent XP is legal.</p><p><strong>Skills:</strong> {skills.filter((skill) => skillRank(character, skill.id) > 0).map((skill) => `${skill.name} ${skillRank(character, skill.id)}`).join(", ") || "None"}</p><p><strong>Gear:</strong> {character.inventory.map((instance) => findItem(instance.itemId).name).join(", ") || "None"}</p></section></section>}
    <div className="wizard-actions"><button className="secondary" disabled={step === 1} onClick={() => window.history.back()}>Back</button>{step < 6 ? <button className="primary" disabled={step === 2 && !startingSkillsComplete(character)} onClick={() => goToStep(step + 1)}>Continue</button> : <button className="primary" disabled={!character.profile.name.trim()} onClick={onComplete}>Create agent</button>}</div>
  </section>;
}

function StartingXpPanel({ character, onUpdate }: { character: Character; onUpdate: CharacterUpdater }) {
  const specialization = findSpecialization(character.build.specializationIds[0]);
  const favorWasSpent = character.inventory.some((instance) => instance.acquisition?.payment === "favor" || Object.values(instance.attachmentAcquisitions ?? {}).some((record) => record.payment === "favor"));
  const cannotReturnBonusXp = character.resources.startingBenefit === "xp" && availableXp(character) < 10;
  const chooseBenefit = (benefit: "favor" | "xp") => onUpdate((draft) => {
    if (draft.resources.startingBenefit === benefit) return draft;
    if (benefit === "xp") {
      const spentFavor = draft.inventory.some((instance) => instance.acquisition?.payment === "favor" || Object.values(instance.attachmentAcquisitions ?? {}).some((record) => record.payment === "favor"));
      if (spentFavor) return draft;
      draft.resources.startingBenefit = "xp";
      draft.resources.favor = Math.max(0, draft.resources.favor - 10);
      draft.resources.bonusStartingXp = 10;
    } else {
      if (availableXp(draft) < 10) return draft;
      draft.resources.startingBenefit = "favor";
      draft.resources.bonusStartingXp = 0;
      draft.resources.favor = Math.min(100, draft.resources.favor + 10);
    }
    return draft;
  });
  return <section className="content-stack nested-stack"><div className="section-heading"><div><p className="eyebrow">Starting XP</p><h2>Shape the agent</h2></div><strong>{availableXp(character)} XP available</strong></div><section className="paper-panel"><p className="eyebrow">Starting benefit</p><h2>Favor or additional experience</h2><p className="instruction">Choose one. This selection is part of the character record and may be changed while the draft can still afford the switch.</p><div className="starting-benefit-options"><label className={character.resources.startingBenefit === "favor" ? "selected" : ""}><input type="radio" name="starting-benefit" checked={character.resources.startingBenefit === "favor"} disabled={cannotReturnBonusXp} onChange={() => chooseBenefit("favor")} /><span><strong>10 starting Favor</strong><small>Begin with Bureau support and the normal archetype XP.</small></span></label><label className={character.resources.startingBenefit === "xp" ? "selected" : ""}><input type="radio" name="starting-benefit" checked={character.resources.startingBenefit === "xp"} disabled={favorWasSpent} onChange={() => chooseBenefit("xp")} /><span><strong>10 additional starting XP</strong><small>Begin with 0 Favor and add 10 XP to the archetype's allowance.</small></span></label></div>{favorWasSpent && character.resources.startingBenefit === "favor" && <p className="field-note">The XP option is locked because starting Favor has already been spent on equipment.</p>}{cannotReturnBonusXp && <p className="field-note">Refund at least 10 XP of purchases before switching back to starting Favor.</p>}</section><CharacteristicPurchasePanel character={character} onUpdate={onUpdate} /><SkillAdvancementPanel character={character} onUpdate={onUpdate} creation /><section><h2>{specialization.name}</h2><TalentTree specialization={specialization} purchasedIds={character.build.purchases.talentNodeIds} availableXp={availableXp(character)} interactive onChange={(ids) => onUpdate((draft) => { draft.build.purchases.talentNodeIds = ids; return draft; })} /></section></section>;
}

function CharacteristicPurchasePanel({ character, onUpdate }: { character: Character; onUpdate: CharacterUpdater }) {
  const values = derivedCharacteristics(character);
  const base = findArchetype(character.build.archetypeId).baseCharacteristics;
  return <section className="paper-panel"><p className="eyebrow">Characteristics</p><h2>Creation-only increases</h2><div className="advancement-grid">{characteristicKeys.map((key) => <div className="advance-row" key={key}><span><strong>{key}</strong><small>Base {base[key]} · Next {nextCharacteristicCost(character, key)} XP</small></span><div className="rank-controls"><button className="secondary" disabled={(character.build.purchases.characteristicRanks[key] ?? 0) === 0} onClick={() => onUpdate((draft) => decreaseCharacteristic(draft, key))}>−</button><b>{values[key]}</b><button className="secondary" disabled={!canIncreaseCharacteristic(character, key)} onClick={() => onUpdate((draft) => increaseCharacteristic(draft, key))}>+</button></div></div>)}</div></section>;
}

function SkillAdvancementPanel({ character, onUpdate, creation = false }: { character: Character; onUpdate: CharacterUpdater; creation?: boolean }) {
  return <section className="paper-panel"><div className="section-heading"><div><p className="eyebrow">Skills</p><h2>{creation ? "Starting skill XP" : "Advance skills"}</h2></div><strong>{availableXp(character)} XP</strong></div><div className="advancement-grid">{skills.map((skill) => { const purchased = character.build.purchases.skillRanks[skill.id] ?? 0; return <div className="advance-row" key={skill.id}><span><strong>{skill.name}</strong><small className="skill-detail">{skill.characteristic} · <DicePoolDisplay pool={skillPool(character, skill.id)} /> · Next {nextSkillRankCost(character, skill.id)} XP</small></span><div className="rank-controls"><button className="secondary" disabled={purchased === 0} onClick={() => onUpdate((draft) => decreaseSkill(draft, skill.id))}>−</button><b>{skillRank(character, skill.id)}</b><button className="secondary" disabled={!canIncreaseSkill(character, skill.id, creation)} onClick={() => onUpdate((draft) => increaseSkill(draft, skill.id, creation))}>+</button></div></div>; })}</div></section>;
}

function startingSkillsComplete(character: Character): boolean {
  const archetype = findArchetype(character.build.archetypeId);
  const s = character.build.startingSkillSelections;
  const archetypeComplete = archetype.startingSkillGroups?.length
    ? archetype.startingSkillGroups.every((group) => (s.archetypeSkillGroups?.[group.id] ?? []).length === group.choiceCount)
    : s.archetypeSkillIds.length === archetype.startingSkillChoiceCount;
  return archetypeComplete && s.careerSkillIds.length === 4 && s.specializationSkillIds.length === 2;
}

function StartingSkillChoices({ character, onUpdate }: { character: Character; onUpdate: (updater: (character: Character) => Character) => void }) {
  const archetype = findArchetype(character.build.archetypeId);
  const career = findCareer(character.build.careerId);
  const specialization = findSpecialization(character.build.specializationIds[0]);
  const selections = character.build.startingSkillSelections;
  type FlatGroup = "archetypeSkillIds" | "careerSkillIds" | "specializationSkillIds";
  const toggle = (key: FlatGroup, skillId: string, limit: number) => onUpdate((draft) => {
    const current = draft.build.startingSkillSelections[key];
    const next = current.includes(skillId) ? current.filter((id) => id !== skillId) : current.length < limit ? [...current, skillId] : current;
    return applyStartingSkillSelections(draft, { ...draft.build.startingSkillSelections, [key]: next });
  });
  const toggleArchetypeGroup = (groupId: string, skillId: string, limit: number) => onUpdate((draft) => {
    const groups = draft.build.startingSkillSelections.archetypeSkillGroups ?? {};
    const current = groups[groupId] ?? [];
    const next = current.includes(skillId) ? current.filter((id) => id !== skillId) : current.length < limit ? [...current, skillId] : current;
    return applyStartingSkillSelections(draft, {
      ...draft.build.startingSkillSelections,
      archetypeSkillGroups: { ...groups, [groupId]: next }
    });
  });
  const group = (label: string, key: FlatGroup, ids: string[], limit: number) => <div className="choice-group"><p><strong>{label}</strong><small>{selections[key].length} / {limit} selected</small></p><div className="choice-chips">{ids.map((id) => { const selected = selections[key].includes(id); return <button key={`${key}-${id}`} type="button" className={selected ? "selected" : ""} disabled={!selected && (character.build.grantedSkillRanks[id] ?? 0) >= 2} onClick={() => toggle(key, id, limit)}>{skillName(id)}</button>; })}</div></div>;
  const archetypeGroups = (archetype.startingSkillGroups ?? []).map((choice) => {
    const selected = selections.archetypeSkillGroups?.[choice.id] ?? [];
    const startingCareerSkills = new Set([...career.careerSkillIds, ...specialization.bonusCareerSkillIds]);
    const options = choice.options ?? choice.eligibleSkillIds
      .filter((id) => !choice.excludesCareerSkills || !startingCareerSkills.has(id))
      .map((id) => ({ id, label: skillName(id), skillId: id }));
    return <div className="choice-group" key={choice.id}><p><strong>{choice.label} ({choice.rank === 1 ? "rank 1" : `rank ${choice.rank}`})</strong><small>{selected.length} / {choice.choiceCount} selected</small></p><div className="choice-chips">{options.map((option) => { const isSelected = selected.includes(option.id); return <button key={`${choice.id}-${option.id}`} type="button" className={isSelected ? "selected" : ""} disabled={!isSelected && (character.build.grantedSkillRanks[option.skillId] ?? 0) + choice.rank > 2} onClick={() => toggleArchetypeGroup(choice.id, option.id, choice.choiceCount)}>{option.label}</button>; })}</div></div>;
  });
  return <div className="starting-skills"><p className="instruction">Choose the archetype options shown below, four career skills, and two starting-specialization skills. Free ranks may not exceed rank 2.</p>{archetypeGroups.length > 0 ? archetypeGroups : archetype.startingSkillChoiceCount > 0 && group(archetype.startingSkillInstructions ?? `${archetype.name} skills`, "archetypeSkillIds", archetype.startingSkillChoiceIds, archetype.startingSkillChoiceCount)}{Object.keys(archetype.fixedStartingSkillRanks ?? {}).length > 0 && <p><strong>Automatic archetype ranks:</strong> {Object.entries(archetype.fixedStartingSkillRanks ?? {}).map(([id, rank]) => `${skillName(id)} ${rank}`).join(", ")}</p>}{group(`${career.name} career skills`, "careerSkillIds", career.careerSkillIds, 4)}{group(`${specialization.name} skills`, "specializationSkillIds", specialization.bonusCareerSkillIds, 2)}</div>;
}

function GearPanel({ character, onUpdate, creation = false }: { character: Character; onUpdate: (updater: (character: Character) => Character) => void; creation?: boolean }) {
  const ordinaryItems = useMemo(() => items.filter((item) => item.id !== "unarmed"), []);
  const categoryItems = (category: "weapon" | "armor" | "gear") => ordinaryItems.filter((item) => item.category === category);
  const [selectedId, setSelectedId] = useState(categoryItems("weapon")[0]?.id ?? ordinaryItems[0]?.id ?? "");
  const [moneyChange, setMoneyChange] = useState(0);
  const selected = findItem(selectedId);
  const favor = itemFavorCost(selected);
  const addItem = (payment: AcquisitionPayment) => onUpdate((draft) => {
    if (payment !== "reward" && !canAcquireNormally(selected.access)) return draft;
    if (payment === "cash" && draft.resources.money < selected.price) return draft;
    if (payment === "favor" && draft.resources.favor < favor) return draft;
    if (payment === "cash") draft.resources.money -= selected.price;
    if (payment === "favor") draft.resources.favor -= favor;
    const amount = payment === "cash" ? selected.price : payment === "favor" ? favor : 0;
    draft.inventory.push({ instanceId: crypto.randomUUID(), itemId: selected.id, equipped: false, attachmentIds: [], acquisition: { payment, amount }, attachmentAcquisitions: {} });
    return draft;
  });
  return <section className="paper-panel"><div className="section-heading"><div><p className="eyebrow">{creation ? "Starting gear" : "Gear"}</p><h2>Equipment catalogue</h2></div><strong>${character.resources.money} · {character.resources.favor} Favor</strong></div>
    <p className="instruction">Choose a category, review the item, then purchase it with starting credits or requisition it with Favor.</p>
    {!creation && <div className="money-adjuster"><label className="field-label">Change available money<input type="number" step="1" value={moneyChange} onChange={(event) => setMoneyChange(Number(event.target.value))} /></label><button className="secondary" disabled={!Number.isFinite(moneyChange) || moneyChange === 0 || character.resources.money + Math.trunc(moneyChange) < 0} onClick={() => { onUpdate((draft) => { draft.resources.money = Math.max(0, draft.resources.money + Math.trunc(moneyChange)); return draft; }); setMoneyChange(0); }}>Apply money change</button><small>Use a positive number to add income or a negative number to record spending outside this catalogue.</small></div>}
    <div className="gear-selectors">{(["weapon", "armor", "gear"] as const).map((category) => <label className="field-label" key={category}>{category === "gear" ? "Equipment" : `${category[0].toUpperCase()}${category.slice(1)}s`}<select value={selected.category === category ? selectedId : ""} onChange={(event) => event.target.value && setSelectedId(event.target.value)}><option value="">Choose {category === "gear" ? "equipment" : `a ${category}`}…</option>{categoryItems(category).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>)}</div>
    <div className="gear-card"><ItemDetails item={selected} showHeading /><div className="inline-actions">{canAcquireNormally(selected.access) ? <><button className="secondary" disabled={character.resources.money < selected.price} onClick={() => addItem("cash")}>Buy ${selected.price}</button><button className="secondary" disabled={character.resources.favor < favor} onClick={() => addItem("favor")}>Requisition {favor} Favor</button></> : <button className="secondary" onClick={() => addItem("reward")}>Add GM reward</button>}</div></div>
    <h3 className="inventory-heading">Acquired equipment</h3>
    {character.inventory.length === 0 ? <p>No gear acquired.</p> : character.inventory.map((instance) => <InventoryRow key={instance.instanceId} character={character} instanceId={instance.instanceId} onUpdate={onUpdate} />)}
  </section>;
}

function InventoryRow({ character, instanceId, onUpdate }: { character: Character; instanceId: string; onUpdate: (updater: (character: Character) => Character) => void }) {
  const instance = character.inventory.find((record) => record.instanceId === instanceId)!;
  const item = findItem(instance.itemId);
  const eligible = attachments.filter((attachment) => attachment.eligibleItemIds.includes(item.id) && !instance.attachmentIds.includes(attachment.id));
  const [modifying, setModifying] = useState(false);
  const [attachmentId, setAttachmentId] = useState(eligible[0]?.id ?? "");
  const attachment = attachments.find((record) => record.id === attachmentId);
  useEffect(() => {
    if (!eligible.some((record) => record.id === attachmentId)) setAttachmentId(eligible[0]?.id ?? "");
  }, [eligible, attachmentId]);
  const install = (payment: AcquisitionPayment) => {
    if (!attachment) return;
    onUpdate((draft) => {
      if (!canInstallAttachment(draft, instanceId, attachment.id)) return draft;
      const favor = itemFavorCost(attachment);
      if (payment !== "reward" && !canAcquireNormally(attachment.access)) return draft;
      if (payment === "cash" && draft.resources.money < attachment.price) return draft;
      if (payment === "favor" && draft.resources.favor < favor) return draft;
      if (payment === "cash") draft.resources.money -= attachment.price;
      if (payment === "favor") draft.resources.favor -= favor;
      const target = draft.inventory.find((record) => record.instanceId === instanceId)!;
      target.attachmentIds.push(attachment.id);
      target.attachmentAcquisitions ??= {};
      target.attachmentAcquisitions[attachment.id] = { payment, amount: payment === "cash" ? attachment.price : payment === "favor" ? favor : 0 };
      return draft;
    });
  };
  const canModify = instance.attachmentIds.length > 0 || eligible.length > 0;
  return <details className="inventory-row"><summary><span><strong>{item.name}</strong><small>{item.category} · {instance.equipped ? "Equipped" : "Carried"} · {remainingHardPoints(character, instanceId)} HP open{instance.attachmentIds.length ? ` · ${instance.attachmentIds.length} mod${instance.attachmentIds.length === 1 ? "" : "s"}` : ""}</small></span></summary><div className="inventory-body"><ItemDetails item={item} /><div className="inline-actions"><button className={instance.equipped ? "primary" : "secondary"} onClick={() => onUpdate((draft) => setItemEquipped(draft, instanceId, !instance.equipped))}>{instance.equipped ? "Equipped" : "Equip"}</button>{canModify && <button className="secondary" onClick={() => setModifying(true)}>Modify</button>}{character.status === "draft" && <button className="secondary" onClick={() => onUpdate((draft) => removeInventoryFromDraft(draft, instanceId))}>Remove and refund</button>}</div></div>{modifying && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModifying(false); }}><section className="modification-dialog" role="dialog" aria-modal="true" aria-labelledby={`modify-${instanceId}`}><div className="section-heading"><div><p className="eyebrow">Item workshop</p><h2 id={`modify-${instanceId}`}>Modify {item.name}</h2></div><button className="text-button" onClick={() => setModifying(false)}>Close</button></div><p><strong>{remainingHardPoints(character, instanceId)} of {item.hardPoints} hard points available</strong></p>{instance.attachmentIds.length > 0 && <div className="installed-modifications"><h3>Installed</h3>{instance.attachmentIds.map((id) => { const record = attachments.find((candidate) => candidate.id === id)!; return <article key={id}><strong>{record.name}</strong><small>{record.hardPoints} HP</small><p><GameText>{record.effect}</GameText></p>{character.status === "draft" && <button className="text-button" onClick={() => onUpdate((draft) => removeAttachmentFromDraft(draft, instanceId, id))}>Remove and refund</button>}</article>; })}</div>}{eligible.length > 0 ? <div className="available-modifications"><h3>Available modifications</h3><label className="field-label">Modification<select value={attachmentId} onChange={(event) => setAttachmentId(event.target.value)}>{eligible.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select></label>{attachment && <div className="modification-preview"><small>{attachment.hardPoints} HP · ${attachment.price} · Rarity {attachment.rarity} · {attachment.access}</small><p><GameText>{attachment.effect}</GameText></p><div className="inline-actions">{canAcquireNormally(attachment.access) ? <><button className="secondary" disabled={character.resources.money < attachment.price || !canInstallAttachment(character, instanceId, attachment.id)} onClick={() => install("cash")}>Install ${attachment.price}</button><button className="secondary" disabled={character.resources.favor < itemFavorCost(attachment) || !canInstallAttachment(character, instanceId, attachment.id)} onClick={() => install("favor")}>Install {itemFavorCost(attachment)} Favor</button></> : <button className="secondary" disabled={!canInstallAttachment(character, instanceId, attachment.id)} onClick={() => install("reward")}>Install reward</button>}</div></div>}</div> : <p>No additional compatible modifications are available.</p>}</section></div>}</details>;
}

function PlayView({ character, onUpdate, onSummary }: { character: Character; onUpdate: (updater: (character: Character) => Character) => void; onSummary: () => void }) {
  const [tab, setTab] = useState<PlayTab>(() => {
    const saved = currentHistoryState()?.playTab;
    return saved && playTabs.includes(saved) ? saved : "dashboard";
  });
  useEffect(() => {
    const restoreTab = (event: PopStateEvent) => {
      const state = event.state as Partial<SierraHistoryState> | null;
      if (state?.view !== "play") return;
      setTab(state.playTab && playTabs.includes(state.playTab) ? state.playTab : "dashboard");
    };
    window.addEventListener("popstate", restoreTab);
    return () => window.removeEventListener("popstate", restoreTab);
  }, []);
  const selectTab = (nextTab: PlayTab) => {
    if (nextTab === tab) return;
    pushHistoryState({ view: "play", activeId: character.id, playTab: nextTab });
    setTab(nextTab);
  };
  const labels: Array<[PlayTab, string]> = [["dashboard", "Dashboard"], ["combat", "Combat"], ["social", "Social"], ["skills", "Skills"], ["gear", "Gear"], ["spec", "Spec"]];
  const swipeHandlers = useSwipeTabs(playTabs, tab, selectTab, onSummary);
  return <div className="swipe-drawer" {...swipeHandlers}><Subnav items={labels} active={tab} onSelect={selectTab} />{tab === "dashboard" && <Dashboard character={character} onUpdate={onUpdate} />}{tab === "combat" && <CombatView character={character} onUpdate={onUpdate} />}{tab === "social" && <SocialView character={character} onUpdate={onUpdate} />}{tab === "skills" && <SkillsReference character={character} />}{tab === "gear" && <section className="content-stack"><GearPanel character={character} onUpdate={onUpdate} /></section>}{tab === "spec" && <SpecReference character={character} />}</div>;
}

function Subnav<T extends string>({ items, active, onSelect }: { items: Array<[T, string]>; active: T; onSelect: (value: T) => void }) {
  return <nav className="mode-tabs" data-swipe-ignore>{items.map(([id, label]) => <button key={id} className={active === id ? "active" : ""} onClick={() => onSelect(id)}>{label}</button>)}</nav>;
}

function Dashboard({ character, onUpdate }: { character: Character; onUpdate: CharacterUpdater }) {
  const equipped = character.inventory.find((instance) => instance.equipped && findItem(instance.itemId).weapon);
  return <section className="content-stack"><div className="section-heading"><div><p className="file-code">PLAY / DASHBOARD</p><h2>Operational status</h2></div><button className="secondary" onClick={() => onUpdate(newEncounter)}>New encounter</button></div><StatusGrid character={character} /><section className="paper-panel"><p className="eyebrow">Primary weapon</p>{equipped ? <WeaponCard character={character} itemId={equipped.itemId} /> : <p>Equip a weapon in Gear to place it here.</p>}</section><section className="paper-panel"><p className="eyebrow">Common checks</p>{["cool", "discipline", "vigilance"].map((id) => <SkillRow key={id} character={character} skillId={id} />)}</section><MotivationSummary character={character} /><TalentReferenceList character={character} onUpdate={onUpdate} filter={(talent) => talent.usage !== "none" || talent.activation === "incidental"} title="Reminders" /></section>;
}

function CombatView({ character, onUpdate }: { character: Character; onUpdate: CharacterUpdater }) {
  const [showSymbolSpends, setShowSymbolSpends] = useState(false);
  const weapons = character.inventory.filter((instance) => instance.equipped && findItem(instance.itemId).weapon).slice(0, 3);
  const check = character.usage.turnChecklist;
  return <section className="content-stack"><div className="section-heading"><div><p className="file-code">PLAY / COMBAT</p><h2>Combat reference</h2></div><button className="secondary symbol-spend-button" type="button" onClick={() => setShowSymbolSpends(true)}>Spend symbols</button></div><ResourceControls character={character} onUpdate={onUpdate} /><StatusGrid character={character} /><section className="paper-panel"><p className="eyebrow">Turn checklist</p><div className="turn-checks"><label><input type="checkbox" checked={check.action} onChange={(event) => onUpdate((draft) => { draft.usage.turnChecklist.action = event.target.checked; return draft; })} /> Action</label><label><input type="checkbox" checked={check.maneuver} onChange={(event) => onUpdate((draft) => { draft.usage.turnChecklist.maneuver = event.target.checked; return draft; })} /> Maneuver</label><label><input type="checkbox" checked={check.extraManeuver} onChange={(event) => onUpdate((draft) => setExtraManeuver(draft, event.target.checked))} /> Extra Maneuver (2 Strain)</label></div><button className="primary" onClick={() => onUpdate(nextTurn)}>Next turn</button></section><section className="paper-panel"><p className="eyebrow">Equipped weapons</p>{weapons.length ? weapons.map((instance) => <WeaponCard key={instance.instanceId} character={character} itemId={instance.itemId} />) : <p>No equipped weapons.</p>}</section><section className="paper-panel"><p className="eyebrow">Maneuvers</p>{maneuvers.map((maneuver) => <details key={maneuver.id}><summary>{maneuver.name} — {maneuver.summary}</summary><p><GameText>{maneuver.rules}</GameText></p></details>)}</section><TalentReferenceList character={character} onUpdate={onUpdate} filter={(talent) => talent.tags.includes("combat")} title="Combat talents" />{showSymbolSpends && <SymbolSpendDialog scene="combat" onClose={() => setShowSymbolSpends(false)} />}</section>;
}

function SocialView({ character, onUpdate }: { character: Character; onUpdate: CharacterUpdater }) {
  const [showSymbolSpends, setShowSymbolSpends] = useState(false);
  return <section className="content-stack"><div className="section-heading"><div><p className="file-code">PLAY / SOCIAL</p><h2>Social encounter</h2></div><button className="secondary symbol-spend-button" type="button" onClick={() => setShowSymbolSpends(true)}>Spend symbols</button></div><ResourceControls character={character} onUpdate={onUpdate} strainOnly /><MotivationSummary character={character} indicators /><section className="paper-panel"><p className="eyebrow">Social pools</p>{["charm", "coercion", "deception", "leadership", "negotiation", "cool", "discipline"].map((id) => <SkillRow key={id} character={character} skillId={id} />)}</section><TalentReferenceList character={character} onUpdate={onUpdate} filter={(talent) => talent.tags.includes("social")} title="Social talents" />{showSymbolSpends && <SymbolSpendDialog scene="social" onClose={() => setShowSymbolSpends(false)} />}</section>;
}

function SkillsReference({ character }: { character: Character }) {
  const ranks = talentRanks(character);
  return <section className="content-stack"><div><p className="file-code">PLAY / SKILLS</p><h2>Complete skill reference</h2></div><section className="paper-panel">{skills.map((skill) => { const linked = talents.filter((talent) => ranks[talent.id] && talent.rules.toLowerCase().includes(skill.name.toLowerCase())); return <details key={skill.id}><summary className="skill-summary"><span>{skill.name} · rank {skillRank(character, skill.id)} · {skill.characteristic}</span><DicePoolDisplay pool={skillPool(character, skill.id)} /></summary><p>Characteristic {derivedCharacteristics(character)[skill.characteristic]}, skill rank {skillRank(character, skill.id)}. Permanent values only.</p>{linked.map((talent) => <details key={talent.id}><summary>{talent.name}</summary><p><GameText>{talent.rules}</GameText></p></details>)}</details>; })}</section></section>;
}

function SpecReference({ character }: { character: Character }) {
  return <section className="content-stack"><div><p className="file-code">PLAY / SPECIALIZATIONS</p><h2>Owned trees</h2></div>{character.build.specializationIds.map((id) => { const specialization = findSpecialization(id); const nodeIds = new Set(specialization.nodes.map((node) => node.id)); return <section key={id}><h2>{specialization.name}</h2><TalentTree specialization={specialization} purchasedIds={character.build.purchases.talentNodeIds.filter((nodeId) => nodeIds.has(nodeId))} availableXp={0} interactive={false} onChange={() => undefined} /></section>; })}<TalentReferenceList character={character} title="All owned talents" /></section>;
}

function SkillRow({ character, skillId }: { character: Character; skillId: string }) {
  const skill = skills.find((record) => record.id === skillId)!;
  return <div className="skill-row"><span><strong>{skill.name}</strong><small>{skill.characteristic} · rank {skillRank(character, skill.id)}</small></span><b><DicePoolDisplay pool={skillPool(character, skill.id)} /></b></div>;
}

function WeaponCard({ character, itemId }: { character: Character; itemId: string }) {
  const item = findItem(itemId);
  if (!item.weapon) return null;
  return <details className="weapon-card"><summary className="weapon-summary"><span>{item.name}</span><DicePoolDisplay pool={skillPool(character, item.weapon.skillId)} /></summary><p>{skillName(item.weapon.skillId)} · Damage {item.weapon.damage} · Critical {item.weapon.critical} · Range {item.weapon.range}{item.weapon.qualities.length ? ` · ${item.weapon.qualities.join(", ")}` : ""}</p><p><GameText>{item.description}</GameText></p></details>;
}

function TalentReferenceList({ character, onUpdate, filter = () => true, title }: { character: Character; onUpdate?: CharacterUpdater; filter?: (talent: TalentRecord) => boolean; title: string }) {
  const ranks = talentRanks(character);
  const owned = talents.filter((talent) => ranks[talent.id] && filter(talent));
  return <section className="paper-panel"><p className="eyebrow">{title}</p>{owned.length ? owned.map((talent) => { const limited = talent.usage === "session" || talent.usage === "encounter"; const key = talent.usage === "session" ? "sessionTalentIds" : "encounterTalentIds"; const checked = character.usage[key].includes(talent.id); return <details key={talent.id}><summary>{talent.name}{talent.ranked ? ` ${ranks[talent.id]}` : ""} · {talent.activation}{limited && onUpdate ? <input aria-label={`${talent.name} used`} type="checkbox" checked={checked} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate((draft) => { const current = draft.usage[key]; draft.usage[key] = event.target.checked ? [...new Set([...current, talent.id])] : current.filter((id) => id !== talent.id); return draft; })} /> : null}</summary><p><GameText>{talent.rules}</GameText></p></details>; }) : <p>No matching purchased talents.</p>}</section>;
}

function ResourceControls({ character, onUpdate, strainOnly = false }: { character: Character; onUpdate: CharacterUpdater; strainOnly?: boolean }) {
  const status = thresholds(character);
  return <section className="paper-panel resource-controls">{!strainOnly && <div><span>Wounds</span><div className="rank-controls"><button className="secondary" onClick={() => onUpdate((draft) => applyWounds(draft, -1))}>−</button><b>{character.resources.wounds} / {status.wounds}</b><button className="secondary" onClick={() => onUpdate((draft) => applyWounds(draft, 1))}>+</button></div></div>}<div><span>Strain</span><div className="rank-controls"><button className="secondary" onClick={() => onUpdate((draft) => applyStrain(draft, -1))}>−</button><b>{character.resources.strain} / {status.strain}</b><button className="secondary" onClick={() => onUpdate((draft) => applyStrain(draft, 1))}>+</button></div></div></section>;
}

function AdvanceView({ character, onUpdate, onSessionUpdate, onSummary }: { character: Character; onUpdate: (updater: (character: Character) => Character) => void; onSessionUpdate: (xpChange: number, favorChange: number) => void; onSummary: () => void }) {
  const [tab, setTab] = useState<AdvanceTab>(() => {
    const saved = currentHistoryState()?.advanceTab;
    return saved && advanceTabs.includes(saved) ? saved : "update";
  });
  useEffect(() => {
    const restoreTab = (event: PopStateEvent) => {
      const state = event.state as Partial<SierraHistoryState> | null;
      if (state?.view !== "advance") return;
      setTab(state.advanceTab && advanceTabs.includes(state.advanceTab) ? state.advanceTab : "update");
    };
    window.addEventListener("popstate", restoreTab);
    return () => window.removeEventListener("popstate", restoreTab);
  }, []);
  const selectTab = (nextTab: AdvanceTab) => {
    if (nextTab === tab) return;
    pushHistoryState({ view: "advance", activeId: character.id, advanceTab: nextTab });
    setTab(nextTab);
  };
  const labels: Array<[AdvanceTab, string]> = [["update", "Update"], ["specs", "Specs"], ["skills", "Skills"], ["profile", "Profile"]];
  const swipeHandlers = useSwipeTabs(advanceTabs, tab, selectTab, onSummary);
  return <div className="swipe-drawer" {...swipeHandlers}><Subnav items={labels} active={tab} onSelect={selectTab} />{tab === "update" && <section className="content-stack"><SessionUpdatePanel character={character} onApply={onSessionUpdate} /></section>}{tab === "specs" && <SpecializationAdvancement character={character} onUpdate={onUpdate} />}{tab === "skills" && <section className="content-stack"><SkillAdvancementPanel character={character} onUpdate={onUpdate} /></section>}{tab === "profile" && <section className="content-stack"><ProfileEditor character={character} onUpdate={onUpdate} /><MotivationEditor character={character} onUpdate={onUpdate} /></section>}</div>;
}

function SpecializationAdvancement({ character, onUpdate }: { character: Character; onUpdate: CharacterUpdater }) {
  const available = specializations.filter((record) => !character.build.specializationIds.includes(record.id));
  const [newSpecId, setNewSpecId] = useState(available[0]?.id ?? "");
  useEffect(() => { if (!available.some((record) => record.id === newSpecId)) setNewSpecId(available[0]?.id ?? ""); }, [available, newSpecId]);
  const candidate = available.find((record) => record.id === newSpecId);
  const cost = candidate ? specializationAcquisitionCost(character.build.specializationIds.length, candidate.careerId === null || candidate.careerId === character.build.careerId) : 0;
  return <section className="content-stack"><section className="paper-panel"><div className="section-heading"><div><p className="file-code">ADVANCE / SPECIALIZATIONS</p><h2>Acquire specialization</h2></div><strong>{availableXp(character)} XP available</strong></div>{candidate && <><select value={newSpecId} onChange={(event) => setNewSpecId(event.target.value)}>{available.map((record) => <option key={record.id} value={record.id}>{record.name}{record.careerId === null ? " — Universal" : record.careerId === character.build.careerId ? " — Career" : " — Out of career"}</option>)}</select><button className="primary" disabled={availableXp(character) < cost} onClick={() => onUpdate((draft) => { draft.build.specializationIds.push(candidate.id); draft.build.purchases.specializationIds.push(candidate.id); return draft; })}>Acquire for {cost} XP</button></>}</section>{character.build.specializationIds.map((id) => { const specialization = findSpecialization(id); const nodeIds = new Set(specialization.nodes.map((node) => node.id)); const purchased = character.build.purchases.talentNodeIds.filter((nodeId) => nodeIds.has(nodeId)); return <section key={id}><div className="section-heading"><div><p className="eyebrow">Owned specialization</p><h2>{specialization.name}</h2></div><strong>{availableXp(character)} XP available</strong></div><TalentTree specialization={specialization} purchasedIds={purchased} availableXp={availableXp(character)} interactive onChange={(ids) => onUpdate((draft) => { const otherNodeIds = draft.build.purchases.talentNodeIds.filter((nodeId) => !nodeIds.has(nodeId)); draft.build.purchases.talentNodeIds = [...otherNodeIds, ...ids]; return draft; })} /></section>; })}</section>;
}

function SessionUpdatePanel({ character, onApply }: { character: Character; onApply: (xpChange: number, favorChange: number) => void }) {
  const [xpChange, setXpChange] = useState(0); const [favorChange, setFavorChange] = useState(0);
  const [backedUp, setBackedUp] = useState(false);
  return <section className="paper-panel"><p className="eyebrow">End of session</p><h2>Apply final changes</h2><p className="instruction">Enter the XP award and final Favor change determined at the table. Applying the update resets once-per-session talent uses and downloads a fresh backup of this character.</p><div className="update-fields"><label className="field-label">XP change<input type="number" value={xpChange} onChange={(event) => { setXpChange(Number(event.target.value)); setBackedUp(false); }} /></label><label className="field-label">Favor change<input type="number" value={favorChange} onChange={(event) => { setFavorChange(Number(event.target.value)); setBackedUp(false); }} /></label></div><button className="primary" disabled={xpChange === 0 && favorChange === 0} onClick={() => { onApply(xpChange, favorChange); setXpChange(0); setFavorChange(0); setBackedUp(true); }}>Apply session update and backup</button>{backedUp && <p className="success-note" role="status">Session changes saved. Character backup downloaded.</p>}<p><small>Current totals: {character.resources.xpAwarded} awarded XP · {character.resources.favor} Favor</small></p></section>;
}

function ProfileEditor({ character, onUpdate }: { character: Character; onUpdate: CharacterUpdater }) {
  const loadPortrait = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdate((draft) => { draft.profile.portraitDataUrl = String(reader.result); return draft; });
    reader.readAsDataURL(file);
  };
  return <section className="paper-panel"><p className="eyebrow">Profile</p><h2>Agent file</h2><div className="profile-editor"><Portrait character={character} large /><div><label className="field-label">Character art<input type="file" accept="image/*" onChange={(event) => loadPortrait(event.target.files?.[0])} /></label>{character.profile.portraitDataUrl && <label className="field-label">Portrait vertical framing<input type="range" min="0" max="100" value={character.profile.portraitFocusY ?? 50} onChange={(event) => onUpdate((draft) => { draft.profile.portraitFocusY = Number(event.target.value); return draft; })} /></label>}</div></div><label className="field-label">Agent name<input value={character.profile.name} onChange={(event) => onUpdate((draft) => { draft.profile.name = event.target.value; return draft; })} /></label><label className="field-label">Backstory<textarea rows={7} value={character.profile.backstory} onChange={(event) => onUpdate((draft) => { draft.profile.backstory = event.target.value; return draft; })} /></label></section>;
}

function MotivationEditor({ character, onUpdate }: { character: Character; onUpdate: CharacterUpdater }) {
  return <section className="paper-panel"><p className="eyebrow">Motivations</p><h2>What drives the agent</h2><p className="instruction">Choose each facet from the Genesys Core Rulebook examples, review its meaning, then record what makes it specific to this agent. These entries appear automatically in Summary and Social.</p><div className="motivation-editor">{motivationKeys.map((key) => <MotivationField key={key} motivationKey={key} character={character} onUpdate={onUpdate} />)}</div></section>;
}

function MotivationSummary({ character, indicators = false }: { character: Character; indicators?: boolean }) {
  return <section className="paper-panel"><p className="eyebrow">Motivations</p><div className="motivation-grid">{motivationKeys.map((key) => { const selection = character.profile.motivations[key]; const option = findMotivationOption(key, selection.optionId); return <div key={key}><span className={indicators ? "motivation-indicator" : ""}>{motivationLabels[key]}</span><p><strong>{option?.name ?? "Not selected"}</strong>{selection.detail && <><br />{selection.detail}</>}</p></div>; })}</div></section>;
}

function MotivationField({ motivationKey, character, onUpdate }: { motivationKey: MotivationKey; character: Character; onUpdate: CharacterUpdater }) {
  const selection = character.profile.motivations[motivationKey];
  const option = findMotivationOption(motivationKey, selection.optionId);
  return <section className="motivation-field"><label className="field-label">{motivationLabels[motivationKey]}<select value={selection.optionId} onChange={(event) => onUpdate((draft) => { draft.profile.motivations[motivationKey].optionId = event.target.value; return draft; })}><option value="">Choose {motivationLabels[motivationKey].toLowerCase()}…</option>{motivationOptions[motivationKey].map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select></label>{option && <details className="motivation-reference"><summary>What {option.name} means</summary><p>{option.description}</p></details>}<label className="field-label">Agent-specific detail<textarea rows={3} value={selection.detail} onChange={(event) => onUpdate((draft) => { draft.profile.motivations[motivationKey].detail = event.target.value; return draft; })} placeholder={`How does ${option?.name ?? `this ${motivationLabels[motivationKey].toLowerCase()}`} appear in this agent?`} /></label></section>;
}

function StatusGrid({ character }: { character: Character }) {
  const status = thresholds(character);
  const defense = defenses(character);
  return <section className="status-grid"><div><span>Wounds</span><strong>{character.resources.wounds} / {status.wounds}</strong></div><div><span>Strain</span><strong>{character.resources.strain} / {status.strain}</strong></div><div><span>Soak</span><strong>{status.soak}</strong></div><div><span>Melee Defense</span><strong>{defense.melee}</strong></div><div><span>Ranged Defense</span><strong>{defense.ranged}</strong></div><div><span>Favor</span><strong>{character.resources.favor}</strong></div><div><span>Available XP</span><strong>{availableXp(character)}</strong></div><div><span>Money</span><strong>${character.resources.money}</strong></div></section>;
}

function CharacteristicStrip({ values }: { values: ReturnType<typeof derivedCharacteristics> }) {
  return <div className="characteristic-strip">{Object.entries(values).map(([name, value]) => <div key={name}><span>{name.slice(0, 3)}</span><strong>{value}</strong></div>)}</div>;
}
