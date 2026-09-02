// Dev check, not shipped: renders the example document and dumps the paragraph
// properties of the result, so the export can be compared with a reference
// .docx without opening Word.
import { writeFileSync } from "node:fs"
import JSZip from "jszip"
import { Packer } from "docx"

import { exampleDocument } from "../src/model/document.ts"
import { buildCvDocx } from "../src/services/cvDocx.ts"

const seed = {
  summaryTitle: "Profile",
  experienceTitle: "Experience",
  educationTitle: "Education",
  skillsTitle: "Skills",
  fileName: "",
}

const styleId = process.argv[2] ?? "hud"
const doc = { ...exampleDocument(seed), styleId }
const buffer = await Packer.toBuffer(buildCvDocx(doc))
writeFileSync("smoke.docx", buffer)

const zip = await JSZip.loadAsync(buffer)
const xml = await zip.file("word/document.xml").async("string")

console.log(xml.match(/<w:pgMar[^>]*\/>/)?.[0])
console.log(xml.match(/<w:pgSz[^>]*\/>/)?.[0])

const body = xml.slice(xml.indexOf("<w:body>"), xml.indexOf("</w:body>"))
const paragraphs = body.match(/<w:p(?: [^>]*)?>[\s\S]*?<\/w:p>/g) ?? []

const text = (p) =>
  p
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")

paragraphs.forEach((p, i) => {
  const pPr = p.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? ""
  const tags = [
    /<w:numPr>/.test(pPr) && "bullet",
    pPr.match(/<w:ind [^>]*\/>/)?.[0].replace(/<w:ind |\/>/g, "").trim(),
    pPr.match(/<w:spacing [^>]*\/>/)?.[0].replace(/<w:spacing |\/>/g, "").trim(),
    /<w:bottom /.test(pPr) && "rule",
    /<w:tabs>/.test(pPr) && "tabstop",
    `sz=${[...new Set([...p.matchAll(/<w:sz w:val="(\d+)"\/>/g)].map((m) => m[1]))].join(",")}`,
    /<w:b\/>/.test(p) && "b",
    /<w:u /.test(p) && "u",
  ]
    .filter(Boolean)
    .join(" ")

  const body = text(p)
  console.log(`[${String(i).padStart(3, "0")}] ${tags}`)
  console.log(`      ${JSON.stringify(body.slice(0, 110))}`)
})

console.log(`\ntotal paragraphs: ${paragraphs.length}`)
