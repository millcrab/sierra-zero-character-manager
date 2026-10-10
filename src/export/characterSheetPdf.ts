import { jsPDF } from "jspdf";
import type { Character } from "../types";
import { createCharacterSheetModel, type CharacterSheetModel } from "./characterSheetModel";

const pageWidth = 612;
const pageHeight = 792;
const margin = 42;
const contentWidth = pageWidth - margin * 2;
const red: [number, number, number] = [122, 32, 32];
const charcoal: [number, number, number] = [27, 27, 27];
const paper: [number, number, number] = [246, 243, 235];
const gray: [number, number, number] = [92, 88, 82];
const abilityGreen: [number, number, number] = [53, 168, 74];
const proficiencyYellow: [number, number, number] = [239, 202, 38];

function safeText(value: string) {
  return value.normalize("NFKD")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function filenameFor(name: string) {
  const slug = name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "sierra-zero-agent";
  return `${slug}-character-sheet.pdf`;
}

function drawPolygon(doc: jsPDF, points: Array<[number, number]>, fill: [number, number, number], stroke: [number, number, number] = charcoal) {
  const [first, ...rest] = points;
  const segments: Array<[number, number]> = [];
  let previous = first;
  for (const point of [...rest, first]) {
    segments.push([point[0] - previous[0], point[1] - previous[1]]);
    previous = point;
  }
  doc.setFillColor(...fill); doc.setDrawColor(...stroke); doc.setLineWidth(.55);
  doc.lines(segments, first[0], first[1], [1, 1], "FD", true);
}

function drawDie(doc: jsPDF, type: "ability" | "proficiency", x: number, y: number, size = 10) {
  if (type === "ability") {
    drawPolygon(doc, [[x + size / 2, y], [x + size, y + size / 2], [x + size / 2, y + size], [x, y + size / 2]], abilityGreen);
    return;
  }
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const points = Array.from({ length: 5 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 5;
    return [centerX + Math.cos(angle) * size / 2, centerY + Math.sin(angle) * size / 2] as [number, number];
  });
  drawPolygon(doc, points, proficiencyYellow);
}

async function cropPortrait(dataUrl: string, focusY: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const width = 480;
      const height = 600;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Could not prepare portrait."));
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawnWidth = image.naturalWidth * scale;
      const drawnHeight = image.naturalHeight * scale;
      const overflowY = Math.max(0, drawnHeight - height);
      context.drawImage(image, (width - drawnWidth) / 2, -overflowY * Math.max(0, Math.min(100, focusY)) / 100, drawnWidth, drawnHeight);
      resolve(canvas.toDataURL("image/jpeg", .88));
    };
    image.onerror = () => reject(new Error("Could not read portrait."));
    image.src = dataUrl;
  });
}

export function renderCharacterSheetPdf(model: CharacterSheetModel, portraitJpeg?: string): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter", compress: true });
  doc.setProperties({
    title: `${safeText(model.name)} - Sierra Zero Character Sheet`,
    subject: "Human-readable Sierra Zero character dossier",
    author: "Sierra Zero Character Manager",
    creator: "Sierra Zero Character Manager"
  });
  let pageNumber = 1;
  let y = margin;

  const pageBase = () => {
    doc.setFillColor(...paper); doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setFillColor(...charcoal); doc.rect(0, 0, pageWidth, 25, "F");
    doc.setTextColor(235, 231, 221); doc.setFont("helvetica", "bold"); doc.setFontSize(7);
    doc.text("SIERRA ZERO / OFFICE OF EXCEPTIONAL CONTINGENCY", margin, 16);
    doc.setTextColor(...gray); doc.setFont("helvetica", "normal");
    doc.text(`${safeText(model.fileCode)}  /  PAGE ${pageNumber}`, pageWidth - margin, pageHeight - 21, { align: "right" });
    doc.setDrawColor(...red); doc.setLineWidth(2); doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
    y = 48;
  };
  const newPage = () => { doc.addPage(); pageNumber += 1; pageBase(); };
  const ensure = (height: number) => { if (y + height > pageHeight - 45) newPage(); };
  const section = (title: string) => {
    ensure(30); y += 8;
    doc.setFillColor(...charcoal); doc.rect(margin, y, contentWidth, 18, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text(safeText(title).toUpperCase(), margin + 8, y + 12); y += 27;
  };
  const paragraph = (text: string, x = margin, width = contentWidth, size = 9, color = gray) => {
    const lines = doc.splitTextToSize(safeText(text) || "-", width) as string[];
    ensure(lines.length * (size + 3) + 4);
    doc.setTextColor(...color); doc.setFont("helvetica", "normal"); doc.setFontSize(size);
    doc.text(lines, x, y); y += lines.length * (size + 3) + 5;
  };
  const ruleBlock = (title: string, body: string) => {
    const lines = doc.splitTextToSize(safeText(body), contentWidth) as string[];
    ensure(21 + lines.length * 11);
    doc.setTextColor(...red); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(safeText(title), margin, y); y += 13;
    paragraph(body);
  };
  const drawTalentTree = (specialization: CharacterSheetModel["specializations"][number]) => {
    newPage();
    section(`${specialization.name} specialization tree`);
    y += 7;
    doc.setTextColor(...gray); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text("Purchased talents are marked in red. Connector paths work in both directions.", margin, y); y += 22;
    const nodeGapX = 10;
    const nodeGapY = 24;
    const nodeWidth = (contentWidth - nodeGapX * 3) / 4;
    const nodeHeight = 82;
    const treeTop = y;
    const positions = new Map(specialization.nodes.map((node) => [node.id, {
      x: margin + (node.column - 1) * (nodeWidth + nodeGapX),
      y: treeTop + (node.row - 1) * (nodeHeight + nodeGapY)
    }]));

    specialization.edges.forEach(([leftId, rightId]) => {
      const left = positions.get(leftId)!;
      const right = positions.get(rightId)!;
      const leftNode = specialization.nodes.find((node) => node.id === leftId)!;
      const rightNode = specialization.nodes.find((node) => node.id === rightId)!;
      const bothPurchased = leftNode.purchased && rightNode.purchased;
      const onePurchased = leftNode.purchased || rightNode.purchased;
      doc.setDrawColor(...(bothPurchased ? red : onePurchased ? [176, 107, 39] as [number, number, number] : [128, 123, 114] as [number, number, number]));
      doc.setLineWidth(bothPurchased ? 3 : 2);
      doc.line(left.x + nodeWidth / 2, left.y + nodeHeight / 2, right.x + nodeWidth / 2, right.y + nodeHeight / 2);
    });

    specialization.nodes.forEach((node) => {
      const position = positions.get(node.id)!;
      const nodeFill: [number, number, number] = node.purchased ? red : [232, 227, 217];
      const nodeStroke: [number, number, number] = node.purchased ? [86, 21, 21] : [116, 114, 108];
      const nodeText: [number, number, number] = node.purchased ? [255, 255, 255] : charcoal;
      doc.setFillColor(...nodeFill);
      doc.setDrawColor(...nodeStroke); doc.setLineWidth(node.purchased ? 2 : 1);
      doc.roundedRect(position.x, position.y, nodeWidth, nodeHeight, 2, 2, "FD");
      if (node.defining) drawDie(doc, "ability", position.x + nodeWidth - 15, position.y + 6, 8);
      doc.setTextColor(...nodeText);
      doc.setFont("helvetica", "bold"); doc.setFontSize(7.2);
      const nameLines = doc.splitTextToSize(safeText(node.name).toUpperCase(), nodeWidth - 14) as string[];
      doc.text(nameLines.slice(0, 4), position.x + 7, position.y + 18);
      if (node.purchased) {
        doc.setFillColor(255, 255, 255); doc.roundedRect(position.x + 6, position.y + nodeHeight - 20, 35, 13, 2, 2, "F");
        doc.setTextColor(...red); doc.setFontSize(6); doc.text("TAKEN", position.x + 23.5, position.y + nodeHeight - 11, { align: "center" });
      }
      doc.setFillColor(...charcoal); doc.roundedRect(position.x + nodeWidth - 39, position.y + nodeHeight - 20, 33, 13, 2, 2, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.text(`${node.cost} XP`, position.x + nodeWidth - 22.5, position.y + nodeHeight - 11, { align: "center" });
    });
    y = treeTop + 5 * nodeHeight + 4 * nodeGapY;
  };

  pageBase();
  doc.setTextColor(...red); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("ACTIVE RESPONDER DOSSIER", margin, y); y += 14;
  doc.setTextColor(...charcoal); doc.setFont("times", "bold"); doc.setFontSize(28);
  const nameWidth = portraitJpeg ? 380 : contentWidth;
  const nameLines = doc.splitTextToSize(safeText(model.name), nameWidth) as string[];
  doc.text(nameLines, margin, y + 23); y += nameLines.length * 27 + 4;
  doc.setTextColor(...gray); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(safeText(model.identity), margin, y); y += 18;
  if (portraitJpeg) {
    doc.setDrawColor(...charcoal); doc.setLineWidth(1); doc.rect(pageWidth - margin - 102, 48, 102, 128);
    doc.addImage(portraitJpeg, "JPEG", pageWidth - margin - 99, 51, 96, 122, undefined, "FAST");
  }

  section("Operational status");
  const statWidth = contentWidth / 4;
  model.status.forEach((stat, index) => {
    const x = margin + (index % 4) * statWidth;
    const rowY = y + Math.floor(index / 4) * 42;
    doc.setFillColor(232, 227, 217); doc.rect(x, rowY, statWidth - 4, 36, "F");
    doc.setTextColor(...gray); doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.text(safeText(stat.label).toUpperCase(), x + 7, rowY + 11);
    doc.setTextColor(...charcoal); doc.setFontSize(13); doc.text(safeText(stat.value), x + 7, rowY + 28);
  });
  y += 88;

  section("Characteristics");
  const characteristicWidth = contentWidth / 6;
  model.characteristics.forEach((characteristic, index) => {
    const x = margin + index * characteristicWidth;
    doc.setFillColor(...charcoal); doc.rect(x, y, characteristicWidth - 4, 43, "F");
    doc.setTextColor(190, 186, 177); doc.setFont("helvetica", "bold"); doc.setFontSize(6); doc.text(characteristic.name.slice(0, 3).toUpperCase(), x + (characteristicWidth - 4) / 2, y + 12, { align: "center" });
    doc.setTextColor(255, 255, 255); doc.setFontSize(17); doc.text(String(characteristic.value), x + (characteristicWidth - 4) / 2, y + 34, { align: "center" });
  });
  y += 49;

  section("Motivations");
  model.motivations.forEach((motivation) => {
    ensure(40);
    doc.setTextColor(...red); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text(`${safeText(motivation.label).toUpperCase()} / ${safeText(motivation.name)}`, margin, y); y += 11;
    paragraph(motivation.detail || motivation.description, margin, contentWidth, 8.5);
  });

  section("Archetype capabilities");
  model.abilities.forEach((ability) => ruleBlock(ability.name, ability.rules));

  newPage();
  section("Skills");
  const columnWidth = (contentWidth - 16) / 2;
  const rowsPerColumn = Math.ceil(model.skills.length / 2);
  const skillsTop = y;
  model.skills.forEach((skill, index) => {
    const column = Math.floor(index / rowsPerColumn);
    const row = index % rowsPerColumn;
    const x = margin + column * (columnWidth + 16);
    const rowY = skillsTop + row * 24;
    doc.setDrawColor(207, 201, 190); doc.line(x, rowY + 19, x + columnWidth, rowY + 19);
    doc.setTextColor(...charcoal); doc.setFont("helvetica", skill.rank ? "bold" : "normal"); doc.setFontSize(8.5); doc.text(safeText(skill.name), x, rowY + 8);
    doc.setTextColor(...gray); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.text(`${skill.characteristic.slice(0, 3).toUpperCase()}  RANK ${skill.rank}`, x, rowY + 16);
    const dice = [
      ...Array.from({ length: skill.dice.proficiency }, () => "proficiency" as const),
      ...Array.from({ length: skill.dice.ability }, () => "ability" as const)
    ];
    const dieSize = 10;
    const dieGap = 3;
    const poolWidth = dice.length * dieSize + Math.max(0, dice.length - 1) * dieGap;
    dice.forEach((type, dieIndex) => drawDie(doc, type, x + columnWidth - poolWidth + dieIndex * (dieSize + dieGap), rowY + 3, dieSize));
  });
  y = skillsTop + rowsPerColumn * 24 + 5;

  section("Talents");
  if (!model.talents.length) paragraph("No talents purchased.");
  model.talents.forEach((talent) => ruleBlock(`${talent.name}${talent.rank > 1 ? ` (Rank ${talent.rank})` : ""} / ${talent.activation}`, talent.rules));

  model.specializations.forEach(drawTalentTree);

  newPage();
  section("Weapons, armor, and gear");
  if (!model.equipment.length) paragraph("No equipment recorded.");
  model.equipment.forEach((item) => {
    ensure(48);
    doc.setTextColor(...charcoal); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(`${safeText(item.name)}${item.equipped ? "  [EQUIPPED]" : ""}`, margin, y); y += 12;
    doc.setTextColor(...red); doc.setFontSize(7); doc.text(`${item.category.toUpperCase()} / ${safeText(item.stats)}`, margin, y); y += 10;
    if (item.description) paragraph(item.description, margin, contentWidth, 8.5);
    item.attachments.forEach((attachment) => paragraph(`Modification - ${attachment}`, margin + 10, contentWidth - 10, 8));
    y += 4;
  });

  section("Agent history and notes");
  paragraph(model.backstory || "No backstory recorded.", margin, contentWidth, 9.5, charcoal);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setTextColor(...gray); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
    doc.text(`Generated by Sierra Zero Character Manager  /  ${page} of ${totalPages}`, margin, pageHeight - 21);
  }
  return doc;
}

export async function downloadCharacterSheetPdf(character: Character) {
  const model = createCharacterSheetModel(character);
  let portrait: string | undefined;
  if (model.portraitDataUrl) {
    try { portrait = await cropPortrait(model.portraitDataUrl, model.portraitFocusY); } catch { portrait = undefined; }
  }
  renderCharacterSheetPdf(model, portrait).save(filenameFor(model.name));
}
