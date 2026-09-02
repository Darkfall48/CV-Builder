//? Libraries
import JSZip from "jszip"

//? Model
import type { CvDocument } from "../model/types"

//? Services
import type { AtsFinding } from "./atsAudit"

export type AtsDocxResult = {
  findings: AtsFinding[]
  plainText: string
}

const filled = (value: string) => value.trim() !== ""
const normal = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}@.+#/-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()

function expectedFragments(doc: CvDocument): string[] {
  const fragments = [doc.identity.name]
  if (doc.identity.visibility.headline) fragments.push(doc.identity.headline)
  if (doc.identity.visibility.email) fragments.push(doc.identity.email)
  if (doc.identity.visibility.phone) fragments.push(doc.identity.phone)
  if (doc.identity.visibility.location) fragments.push(doc.identity.location)
  fragments.push(
    ...doc.identity.links.map((link) =>
      filled(link.label) ? link.label : link.url,
    ),
  )

  if (doc.summary.visible) {
    fragments.push(doc.summary.title)
    for (const line of doc.summary.items) {
      if (line.visible) fragments.push(line.lead, line.text)
    }
  }
  if (doc.experience.visible) {
    fragments.push(doc.experience.title)
    for (const role of doc.experience.items) {
      if (!role.visible) continue
      fragments.push(role.period, role.title, role.company, role.location)
      for (const bullet of role.bullets) {
        if (bullet.visible) fragments.push(bullet.lead, bullet.text)
      }
    }
  }
  if (doc.education.visible) {
    fragments.push(doc.education.title)
    for (const entry of doc.education.items) {
      if (entry.visible) {
        fragments.push(entry.period, entry.title, entry.school)
      }
    }
  }
  if (doc.skills.visible) {
    fragments.push(doc.skills.title)
    for (const group of doc.skills.items) {
      if (group.visible) fragments.push(group.label, group.items)
    }
  }
  if (doc.languages.visible) {
    fragments.push(doc.languages.title, doc.languages.text)
  }
  fragments.push(doc.footnote)

  return fragments.map(normal).filter((fragment) => fragment.length >= 2)
}

function paragraphs(xml: Document): string[] {
  return [...xml.getElementsByTagName("w:p")]
    .map((paragraph) =>
      [...paragraph.getElementsByTagName("w:t")]
        .map((text) => text.textContent ?? "")
        .join(""),
    )
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/**
 * Generates the exact downloadable DOCX, opens its OOXML package again, and
 * flattens its body to text. This catches export regressions that a model-only
 * checklist cannot see, while the file and its contents stay in the browser.
 */
export async function auditDocx(doc: CvDocument): Promise<AtsDocxResult> {
  const { renderCvDocx } = await import("./cvDocx")
  const blob = await renderCvDocx(doc)
  const zip = await JSZip.loadAsync(blob)
  const documentFile = zip.file("word/document.xml")
  if (!documentFile) {
    return {
      plainText: "",
      findings: [
        {
          code: "docxUnreadable",
          layer: "docx",
          status: "fail",
        },
      ],
    }
  }

  const source = await documentFile.async("string")
  const xml = new DOMParser().parseFromString(source, "application/xml")
  if (xml.querySelector("parsererror")) {
    return {
      plainText: "",
      findings: [
        {
          code: "docxUnreadable",
          layer: "docx",
          status: "fail",
        },
      ],
    }
  }

  const lines = paragraphs(xml)
  const plainText = lines.join("\n")
  const flattened = normal(plainText)
  const expected = expectedFragments(doc)
  const retained = expected.filter((fragment) =>
    flattened.includes(fragment),
  ).length
  const retention = expected.length === 0 ? 1 : retained / expected.length

  const hasTables = xml.getElementsByTagName("w:tbl").length > 0
  const hasHeaderFooter = Object.keys(zip.files).some((path) =>
    /^word\/(?:header|footer)\d*\.xml$/i.test(path),
  )
  const hasDrawings =
    xml.getElementsByTagName("w:drawing").length > 0 ||
    xml.getElementsByTagName("w:pict").length > 0 ||
    xml.getElementsByTagName("w:txbxContent").length > 0

  const firstLine = lines[0] ?? ""
  const nameFirst =
    !filled(doc.identity.name) ||
    normal(firstLine).includes(normal(doc.identity.name))

  const relsFile = zip.file("word/_rels/document.xml.rels")
  const relsXml = relsFile
    ? new DOMParser().parseFromString(
        await relsFile.async("string"),
        "application/xml",
      )
    : null
  const hyperlinkTargets = relsXml
    ? [...relsXml.getElementsByTagName("Relationship")]
        .map((node) => node.getAttribute("Target") ?? "")
        .filter((target) => /^https?:\/\//i.test(target))
    : []
  const hiddenHyperlinks = hyperlinkTargets.filter(
    (target) => !flattened.includes(normal(target)),
  ).length
  const nameFound =
    !filled(doc.identity.name) || flattened.includes(normal(doc.identity.name))
  const emailExpected =
    doc.identity.visibility.email && filled(doc.identity.email)
  const emailFound =
    !emailExpected || flattened.includes(normal(doc.identity.email))

  const findings: AtsFinding[] = [
    {
      code: "docxReadable",
      layer: "docx",
      status: "pass",
      values: { paragraphs: lines.length },
    },
    {
      code: nameFound ? "docxNameFound" : "docxNameMissing",
      layer: "docx",
      status: nameFound ? "pass" : "fail",
    },
    {
      code: emailFound ? "docxEmailFound" : "docxEmailMissing",
      layer: "docx",
      status: emailFound ? "pass" : "fail",
    },
    {
      code: hasTables ? "docxTablesFound" : "docxNoTables",
      layer: "docx",
      status: hasTables ? "warning" : "pass",
    },
    {
      code: hasHeaderFooter ? "docxHeaderFound" : "docxBodyOnly",
      layer: "docx",
      status: hasHeaderFooter ? "warning" : "pass",
    },
    {
      code: hasDrawings ? "docxDrawingsFound" : "docxNoDrawings",
      layer: "docx",
      status: hasDrawings ? "fail" : "pass",
    },
    {
      code: nameFirst ? "docxNameFirst" : "docxNameNotFirst",
      layer: "docx",
      status: nameFirst ? "pass" : "warning",
    },
    ...(hiddenHyperlinks > 0
      ? [
          {
            code: "docxLinkUrlsHidden",
            layer: "docx" as const,
            status: "warning" as const,
            values: { count: hiddenHyperlinks },
          },
        ]
      : []),
    {
      code:
        retention >= 0.98
          ? "docxRetentionGood"
          : retention >= 0.9
            ? "docxRetentionPartial"
            : "docxRetentionPoor",
      layer: "docx",
      status:
        retention >= 0.98
          ? "pass"
          : retention >= 0.9
            ? "warning"
            : "fail",
      values: { percent: Math.round(retention * 100) },
    },
  ]

  return { findings, plainText }
}
