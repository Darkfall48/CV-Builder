//? Model
import type { CvDocument } from "../model/types"

//? Services
import { documentStyle } from "./docStyles"
import type { OfferMatch } from "./jobMatch"

export type AtsStatus = "pass" | "warning" | "fail" | "info"
export type AtsLayer = "structure" | "content" | "docx"

export type AtsFinding = {
  code: string
  layer: AtsLayer
  status: AtsStatus
  values?: Record<string, string | number>
}

export type AtsVerdict = "ready" | "review" | "blocked"

export type AtsReport = {
  verdict: AtsVerdict
  findings: AtsFinding[]
}

const filled = (value: string) => value.trim() !== ""

function decorativeBits(...parts: string[]): string[] {
  const hits: string[] = []
  const pattern = /\p{Extended_Pictographic}|[\u2300-\u23FF\u2600-\u27BF]/gu
  for (const part of parts) {
    const found = part.match(pattern)
    if (found) hits.push(...found)
  }
  return [...new Set(hits)]
}

function hasContacts(doc: CvDocument): boolean {
  return (
    (doc.identity.visibility.email && filled(doc.identity.email)) ||
    (doc.identity.visibility.phone && filled(doc.identity.phone)) ||
    (doc.identity.visibility.location && filled(doc.identity.location)) ||
    doc.identity.links.some((link) => filled(link.label) || filled(link.url))
  )
}

const STANDARD_HEADINGS = new Set(
  [
    "summary",
    "professional summary",
    "profile",
    "profil",
    "תקציר",
    "work experience",
    "professional experience",
    "experience",
    "expérience",
    "expérience professionnelle",
    "ניסיון",
    "education",
    "education and courses",
    "formation",
    "formations",
    "השכלה",
    "skills",
    "technical skills",
    "tools and technologies",
    "compétences",
    "outils et technologies",
    "כישורים",
    "languages",
    "langues",
    "שפות",
  ].map((heading) => heading.toLocaleLowerCase()),
)

const normalHeading = (heading: string) =>
  heading
    .trim()
    .replace(/[:：]\s*$/, "")
    .toLocaleLowerCase()

function verdictOf(findings: AtsFinding[]): AtsVerdict {
  if (findings.some((finding) => finding.status === "fail")) return "blocked"
  if (findings.some((finding) => finding.status === "warning")) return "review"
  return "ready"
}

/**
 * Checks what can be known directly from the document model. These rules are
 * deliberately deterministic: they report parser risks, not a made-up score
 * for a proprietary ATS.
 */
export function auditAts(
  doc: CvDocument,
  offer: string,
  match: OfferMatch,
): AtsReport {
  const findings: AtsFinding[] = [
    {
      code: "singleColumn",
      layer: "structure",
      status: "pass",
    },
    {
      code: "bodyContacts",
      layer: "structure",
      status: "pass",
    },
    {
      code: "standardFont",
      layer: "structure",
      status: "pass",
      values: { font: documentStyle(doc.styleId).font },
    },
  ]

  const style = documentStyle(doc.styleId)
  findings.push({
    code: filled(doc.identity.name) ? "nameFound" : "nameMissing",
    layer: "content",
    status: filled(doc.identity.name) ? "pass" : "fail",
  })

  // Compact puts name and contacts in one tabbed paragraph. Parsers that
  // treat the first line as PERSON then miss the email sitting after the tab.
  const nameSharesLine = style.masthead.inlineContact && hasContacts(doc)
  findings.push({
    code: nameSharesLine ? "nameSharedLine" : "nameOwnLine",
    layer: "structure",
    status: nameSharesLine ? "warning" : "pass",
  })

  const email = doc.identity.email.trim()
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  findings.push({
    code:
      doc.identity.visibility.email && validEmail
        ? "emailFound"
        : "emailMissing",
    layer: "content",
    status: doc.identity.visibility.email && validEmail ? "pass" : "fail",
  })

  const phoneVisible =
    doc.identity.visibility.phone && filled(doc.identity.phone)
  const phoneDigits = doc.identity.phone.replace(/\D/g, "")
  if (phoneVisible && phoneDigits.length < 8) {
    findings.push({
      code: "phoneUnparseable",
      layer: "content",
      status: "warning",
    })
  } else {
    findings.push({
      code: phoneVisible ? "phoneFound" : "phoneMissing",
      layer: "content",
      status: phoneVisible ? "pass" : "warning",
    })
  }

  const locationVisible =
    doc.identity.visibility.location && filled(doc.identity.location)
  findings.push({
    code: locationVisible ? "locationFound" : "locationMissing",
    layer: "content",
    status: locationVisible ? "pass" : "warning",
  })

  const fileName = doc.fileName.trim()
  const unsafeName = /[\\/:*?"<>|]/.test(fileName) || fileName === ""
  if (unsafeName) {
    findings.push({
      code: "fileNameUnsafe",
      layer: "structure",
      status: "warning",
    })
  }

  const experience = doc.experience.items.filter((role) => role.visible)
  const usefulExperience = experience.filter(
    (role) => filled(role.title) && filled(role.company),
  )
  findings.push({
    code: usefulExperience.length > 0 ? "experienceFound" : "experienceMissing",
    layer: "content",
    status: usefulExperience.length > 0 ? "pass" : "fail",
  })

  const education = doc.education.items.filter(
    (entry) => entry.visible && (filled(entry.title) || filled(entry.school)),
  )
  findings.push({
    code: education.length > 0 ? "educationFound" : "educationMissing",
    layer: "content",
    status: education.length > 0 ? "pass" : "warning",
  })

  const skills = doc.skills.items.filter(
    (group) => group.visible && (filled(group.label) || filled(group.items)),
  )
  findings.push({
    code: skills.length > 0 ? "skillsFound" : "skillsMissing",
    layer: "content",
    status: skills.length > 0 ? "pass" : "warning",
  })

  const headings = [
    doc.summary.visible ? doc.summary.title : "",
    doc.experience.visible ? doc.experience.title : "",
    doc.education.visible ? doc.education.title : "",
    doc.skills.visible ? doc.skills.title : "",
    doc.languages.visible ? doc.languages.title : "",
  ].filter(filled)
  const customHeadings = headings.filter(
    (heading) => !STANDARD_HEADINGS.has(normalHeading(heading)),
  )
  findings.push({
    code: customHeadings.length === 0 ? "headingsStandard" : "headingsCustom",
    layer: "structure",
    status: customHeadings.length === 0 ? "pass" : "warning",
    values:
      customHeadings.length === 0
        ? undefined
        : { headings: customHeadings.join(", ") },
  })

  const datedEntries = [
    ...experience.map((role) => role.period),
    ...education.map((entry) => entry.period),
  ]
  const datesWithoutYear = datedEntries.filter(
    (period) => !/\b(?:19|20)\d{2}\b/.test(period),
  ).length
  findings.push({
    code: datesWithoutYear === 0 ? "datesReadable" : "datesUnclear",
    layer: "content",
    status: datesWithoutYear === 0 ? "pass" : "warning",
    values:
      datesWithoutYear === 0 ? undefined : { count: datesWithoutYear },
  })

  const blankHeadings = [
    doc.summary.visible ? doc.summary.title : "ok",
    doc.experience.visible ? doc.experience.title : "ok",
    doc.education.visible ? doc.education.title : "ok",
    doc.skills.visible ? doc.skills.title : "ok",
    doc.languages.visible ? doc.languages.title : "ok",
  ].filter((heading) => !filled(heading)).length
  if (blankHeadings > 0) {
    findings.push({
      code: "headingBlank",
      layer: "structure",
      status: "warning",
      values: { count: blankHeadings },
    })
  }

  const ornaments = decorativeBits(
    doc.identity.name,
    doc.identity.headline,
    doc.identity.email,
    doc.identity.phone,
    doc.identity.location,
    ...doc.identity.links.map((link) => link.label),
    doc.summary.title,
    ...doc.summary.items.flatMap((line) => [line.lead, line.text]),
    doc.experience.title,
    ...experience.flatMap((role) => [
      role.title,
      role.company,
      role.location,
      ...role.bullets.flatMap((bullet) => [bullet.lead, bullet.text]),
    ]),
    doc.education.title,
    ...education.flatMap((entry) => [entry.title, entry.school]),
    doc.skills.title,
    ...skills.flatMap((group) => [group.label, group.items]),
    doc.languages.title,
    doc.languages.text,
  )
  if (ornaments.length > 0) {
    findings.push({
      code: "decorativeChars",
      layer: "structure",
      status: "warning",
      values: { marks: ornaments.join(" ") },
    })
  }

  const hasLinkedIn = doc.identity.links.some((link) =>
    /linkedin\.com/i.test(`${link.label} ${link.url}`),
  )
  findings.push({
    code: hasLinkedIn ? "linkedinFound" : "linkedinMissing",
    layer: "content",
    status: hasLinkedIn ? "pass" : "warning",
  })

  const linksWithHiddenTargets = doc.identity.links.filter(
    (link) =>
      filled(link.url) &&
      filled(link.label) &&
      !link.label.toLocaleLowerCase().includes(link.url.toLocaleLowerCase()),
  ).length
  if (linksWithHiddenTargets > 0) {
    findings.push({
      code: "linkTargetsHidden",
      layer: "structure",
      status: "warning",
      values: { count: linksWithHiddenTargets },
    })
  }

  const asked = match.covered.length + match.missing.length
  if (!filled(offer)) {
    findings.push({
      code: "offerMissing",
      layer: "content",
      status: "info",
    })
  } else if (asked === 0) {
    findings.push({
      code: "offerUnrecognized",
      layer: "content",
      status: "warning",
    })
  } else if (match.missing.length === 0) {
    findings.push({
      code: "keywordsCovered",
      layer: "content",
      status: "pass",
    })
  } else {
    findings.push({
      code: "keywordsMissing",
      layer: "content",
      status: "warning",
      values: {
        covered: match.covered.length,
        asked,
        missing: match.missing.length,
      },
    })
  }

  return {
    verdict: verdictOf(findings),
    findings,
  }
}

export function mergeAtsFindings(
  report: AtsReport,
  docxFindings: AtsFinding[],
): AtsReport {
  const findings = [...report.findings, ...docxFindings]
  return { verdict: verdictOf(findings), findings }
}
