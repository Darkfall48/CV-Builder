//? Model
import type {
  CvDocument,
  CvEducationEntry,
  CvLine,
  CvRole,
  CvSkillGroup,
  Id,
} from "./types"

/** Bumped whenever a stored document needs migrating. See storage.ts. */
export const DOCUMENT_VERSION = 2

/**
 * randomUUID is unavailable over plain http on a LAN address, which is exactly
 * how the app gets opened from a phone during testing, so the counter fallback
 * is not theoretical.
 */
let fallbackCount = 0
export function newId(): Id {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  fallbackCount += 1
  return `id-${Date.now().toString(36)}-${fallbackCount}`
}

export function newLine(): CvLine {
  return { id: newId(), lead: "", text: "", visible: true }
}

export function newRole(): CvRole {
  return {
    id: newId(),
    title: "",
    company: "",
    period: "",
    location: "",
    bullets: [newLine()],
    visible: true,
  }
}

export function newEducationEntry(): CvEducationEntry {
  return { id: newId(), period: "", title: "", school: "", visible: true }
}

export function newSkillGroup(): CvSkillGroup {
  return { id: newId(), label: "", items: "", visible: true }
}

/**
 * Section headings are document content, so they cannot be translated at read
 * time — the user may rename them, and an export must not change wording when
 * the interface language does. They are seeded from the interface locale once,
 * at creation, and belong to the document from then on.
 */
export type DocumentSeed = {
  summaryTitle: string
  experienceTitle: string
  educationTitle: string
  skillsTitle: string
  languagesTitle: string
  fileName: string
}

export function emptyDocument(seed: DocumentSeed): CvDocument {
  return {
    version: DOCUMENT_VERSION,
    styleId: "hud",
    dir: "ltr",
    fileName: seed.fileName,
    identity: {
      name: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      links: [],
    },
    summary: { title: seed.summaryTitle, visible: true, items: [newLine()] },
    experience: {
      title: seed.experienceTitle,
      visible: true,
      items: [newRole()],
    },
    education: {
      title: seed.educationTitle,
      visible: true,
      items: [newEducationEntry()],
    },
    skills: { title: seed.skillsTitle, visible: true, items: [newSkillGroup()] },
    languages: { title: seed.languagesTitle, text: "", visible: true },
    footnote: "",
  }
}

/**
 * A filled document to look at before writing one, and the reference the
 * document styles were measured against. It runs a full career to about 99% of
 * one page, which is the case worth demonstrating: the fill gauge means
 * nothing on three bullet points.
 *
 * It carries no phone number. The one on the real CV is not something to ship
 * in a public repository, and the field is there to be typed into — what is
 * typed stays in the browser.
 */
export function exampleDocument(seed: DocumentSeed): CvDocument {
  const base = emptyDocument(seed)
  const line = (lead: string, text: string): CvLine => ({
    ...newLine(),
    lead,
    text,
  })

  return {
    ...base,
    fileName: "Sidney Sebban 2026 - IT Specialist",
    identity: {
      name: "Sidney Sebban",
      headline: "",
      email: "sidneysebban@gmail.com",
      phone: "",
      location: "",
      links: [
        {
          id: newId(),
          label: "LinkedIn",
          url: "https://www.linkedin.com/in/sidneysebban/",
        },
        {
          id: newId(),
          label: "GitHub",
          url: "https://github.com/Darkfall48",
        },
      ],
    },
    // No heading over the profile: it sits straight under the name, which is
    // where a recruiter's eye already is.
    summary: {
      ...base.summary,
      title: "",
      items: [
        line(
          "Multidisciplinary IT Specialist, Technical Support Engineer and Full-Stack Developer",
          " with expertise in cybersecurity, ZTNA, and enterprise infrastructure.",
        ),
        line(
          "",
          "Proven track record delivering technical support, managing complex SaaS and on-prem environments, and developing full-stack tools that streamline operations and enhance user experience.",
        ),
        line(
          "",
          "Skilled in automation, scripting, and infrastructure management across Windows, macOS, and Linux environments.",
        ),
        line(
          "",
          "Strong communicator, focused on sharing knowledge and building efficient, secure, and scalable systems.",
        ),
      ],
    },
    experience: {
      ...base.experience,
      title: "Work Experience:",
      items: [
        {
          ...newRole(),
          period: "2023-Present",
          title:
            "IT Specialist, Technical Support Engineer – Tier 3 & Full-Stack Developer",
          company: "Cyolo",
          bullets: [
            line(
              "Provide technical support",
              " for enterprise deployments in SaaS, on-prem, and DMZ environments.",
            ),
            line(
              "Resolve complex technical issues",
              " involving SSO, SCIM, LDAP/S, SSL/TLS certificates, network configurations, and remote access protocols (RDP, VNC, Telnet) on Linux, Windows, and macOS platforms.",
            ),
            line(
              "Manage and troubleshoot Docker Compose clusters",
              " across multi-site environments.",
            ),
            line(
              "Draft detailed Jira reports",
              " for Product and R&D teams with clear bug documentation and reproduction steps.",
            ),
            line(
              "Maintain KBs",
              " on Confluence, Zendesk, and internal systems for customers and staff, and lead training sessions.",
            ),
            line(
              "Handle daily Zendesk",
              " tickets including incidents, bugs, and configuration requests, while assisting customers via Zoom and Microsoft Teams.",
            ),
            line(
              "Build automation workflows",
              " in PowerShell, Python, and Shell for onboarding, offboarding, and monitoring.",
            ),
            line(
              "Manage hybrid-cloud environments:",
              " VMware ESXi, Proxmox, and AWS.",
            ),
            line(
              "Oversee 50+ SaaS platforms",
              ", including SSO/SCIM integrations, license management, and cost optimization.",
            ),
            line(
              "Own and secure enterprise’s IT infrastructure",
              " (AzureAD, Entra ID, M365, Exchange) in full SOC2 compliance.",
            ),
            line(
              "Build Cyolo Back-Office",
              ", an internal and partner full-stack platform for managing customer tenants and licenses.",
            ),
            line(
              "Build and maintain Cyolo Helpdesk",
              ", a full-stack add-on to the core product — React, Redux, Node, Docker, PWA, and RBAC — so helpdesk admins manage user lifecycles, applications, and vaults. Documentation, releases, and ongoing support.",
            ),
          ],
        },
        // Hidden rather than deleted: this is what the eye toggle is for, and
        // the example is the place to show it.
        {
          ...newRole(),
          period: "2023",
          title: "Software and Hardware Projects Developer",
          company: "Robotika",
          visible: false,
          bullets: [
            line(
              "Built an RFID-to-barcode pipeline",
              " that reads tags in footwear and feeds a brand-facing website.",
            ),
            line(
              "Delivered client automation",
              ": file movement from Excel or CSV lists, Arduino-driven video control, and a G-code pen plotter.",
            ),
          ],
        },
        {
          ...newRole(),
          period: "2018-2021",
          title: "Military service: Technical Support Engineer – Tier 2",
          company: "Air Force, IDF",
          bullets: [
            line(
              "Providing 24/7 technical support",
              ", maintaining network, software, and hardware, and coordinating with qualified technicians as needed.",
            ),
            // Left out of the reference selection, kept in the data.
            { ...newLine(), lead: "Creating and editing videos", text: " with Adobe Premiere Pro and After Effects.", visible: false },
            line(
              "Repairing, and improving network",
              ", video, audio, and electrical cables.",
            ),
          ],
        },
      ],
    },
    education: {
      ...base.education,
      title: "Education and Courses:",
      items: [
        {
          ...newEducationEntry(),
          period: "2022-2023",
          title: "Full-Stack Web Development Certificate",
          school: "Coding Academy",
        },
        {
          ...newEducationEntry(),
          period: "2021-2022",
          title: "Computer Engineering Studies",
          school: "Polytechnique Montreal, Canada",
        },
        {
          ...newEducationEntry(),
          period: "2020",
          title: "Computer Network Management Certification",
          school: "Air Force, IDF",
        },
      ],
    },
    skills: {
      ...base.skills,
      title: "Tools and Technologies",
      items: [
        {
          ...newSkillGroup(),
          label: "Engineering",
          items:
            "JavaScript, Python, C#, PHP, MATLAB, Bash, PowerShell, Shell; React, Vue.js, Angular, HTML, CSS/SCSS/SASS, Responsive Design, Redux; Node.js, Express, REST APIs, JSON, Webhooks; MongoDB, MySQL, SQL Server; Database tools: phpMyAdmin, Studio 3T; Dev tools: Visual Studio Code, Postman; Web: SaaS platforms, PWAs; Principles: Object-Oriented & Reactive Programming.",
        },
        {
          ...newSkillGroup(),
          label: "Platforms & Infra",
          items:
            "Docker, Docker Compose, Git, GitHub; Linux (Ubuntu), Windows, Windows Server, macOS; AWS EC2/S3; Cloud & Virtualization: VMware ESXi, Proxmox; multi-OS virtual machines.",
        },
        {
          ...newSkillGroup(),
          label: "Security, IAM & Networking",
          items:
            "AzureAD, Entra ID, Okta, Active Directory, GPO, LDAP, SSO, SCIM, SAML, OIDC, RBAC, Microsoft XDR; ICAP, DNS records, firewalls, proxies, Fortinet; SSL/TLS & SAN certificates, JWT.",
        },
        {
          ...newSkillGroup(),
          label: "Ops, Monitoring & Collaboration",
          items:
            "Grafana, Prometheus, BetterStack; Zendesk, Jira, Confluence; SSH, SCP, RDP, VNC, Telnet, PuTTY, AnyDesk; Microsoft Intune; Microsoft 365 Word, Excel, PowerPoint, Outlook, Exchange, OneDrive, SharePoint, Visio; TimeClock365, Gong, Salesforce, Mesh, SalesLoft, TravelPerk, HiBob; Figma, Adobe Suite, Avocode, Lunacy; Zoom, Slack, Microsoft Teams.",
        },
      ],
    },
    languages: {
      title: "Languages",
      text: "Hebrew – Fluent | English – Fluent | French – Mother Tongue",
      visible: true,
    },
    footnote: "*Recommendations will be provided upon request",
  }
}

// --- Immutable list helpers ------------------------------------------------

/** Returns a new array with the item at `index` shifted by `delta`. */
export function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return next
}

export function replaceAt<T>(items: T[], index: number, item: T): T[] {
  const next = [...items]
  next[index] = item
  return next
}

export function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index)
}

// --- Reading the document --------------------------------------------------

/**
 * The space between a lead-in and the rest of its line. The user types two
 * separate fields and cannot see the seam, so the document adds the space —
 * unless the line goes on with punctuation, where a space would be wrong.
 * Both the preview and the export call this, or the two would drift apart by
 * a character on every line.
 */
export function leadSpacer(lead: string, text: string): string {
  if (lead.trim() === "" || text === "") return ""
  return /^[\s,.;:)!?]/.test(text) ? "" : " "
}

/**
 * Dates opening a line, punctuated and spaced the way a CV punctuates them.
 * The user types the dates alone; the document adds the rest.
 */
export function periodPrefix(period: string): string {
  const value = period.trim()
  return value === "" ? "" : `${value}:  `
}

/** A stretch of text and whether the style should emphasise it. */
export type InlineRun = { text: string; strong: boolean }

/**
 * The one line that opens a job: dates, then what the job was and where. Only
 * the second half is emphasised — the dates are read as a label, and setting
 * them in the same bold underline as the title makes the line shout.
 */
export function roleHeadRuns(role: CvRole): InlineRun[] {
  const rest = [role.title, role.company, role.location]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ")

  if (rest === "") {
    const period = role.period.trim()
    return period === "" ? [] : [{ text: period, strong: false }]
  }

  const runs: InlineRun[] = []
  const prefix = periodPrefix(role.period)
  if (prefix !== "") runs.push({ text: prefix, strong: false })
  runs.push({ text: rest, strong: true })
  return runs
}

/**
 * A skills line reads as a list of lists — "Dev tools: VS Code, Postman; Web:
 * PWAs" — and the labels inside carry the same weight as the one that opens
 * it. Split on the semicolons the user typed, and whatever introduces a
 * segment with a colon is a label.
 */
const SUB_LABEL = /^([^:,;]{1,44}):\s*([\s\S]*)$/

export function skillRuns(label: string, items: string): InlineRun[] {
  const runs: InlineRun[] = []
  const head = label.trim()
  if (head !== "") runs.push({ text: `${head}:`, strong: true })

  items.split(";").forEach((segment, index) => {
    const text = segment.trim()
    if (text === "") return

    const separator = runs.length === 0 ? "" : index === 0 ? " " : "; "
    if (separator !== "") runs.push({ text: separator, strong: false })

    const match = text.match(SUB_LABEL)
    if (!match) {
      runs.push({ text, strong: false })
      return
    }
    runs.push({ text: `${match[1]}:`, strong: true })
    if (match[2] !== "") runs.push({ text: ` ${match[2]}`, strong: false })
  })

  return runs
}

const joined = (...parts: string[]) => parts.filter(Boolean).join(" ")

/** Everything a visible line says, for matching a job ad against the CV. */
export function documentText(doc: CvDocument): string {
  const parts: string[] = [doc.identity.headline]

  if (doc.summary.visible) {
    for (const item of doc.summary.items) {
      if (item.visible) parts.push(joined(item.lead, item.text))
    }
  }

  if (doc.experience.visible) {
    for (const role of doc.experience.items) {
      if (!role.visible) continue
      parts.push(joined(role.title, role.company))
      for (const bullet of role.bullets) {
        if (bullet.visible) parts.push(joined(bullet.lead, bullet.text))
      }
    }
  }

  if (doc.education.visible) {
    for (const entry of doc.education.items) {
      if (entry.visible) parts.push(joined(entry.title, entry.school))
    }
  }

  if (doc.skills.visible) {
    for (const group of doc.skills.items) {
      if (group.visible) parts.push(joined(group.label, group.items))
    }
  }

  if (doc.languages.visible) parts.push(doc.languages.text)

  return parts.join("\n")
}

/** True when there is nothing worth exporting yet. */
export function isDocumentEmpty(doc: CvDocument): boolean {
  return doc.identity.name.trim() === "" && documentText(doc).trim() === ""
}
