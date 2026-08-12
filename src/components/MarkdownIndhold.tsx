import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import InfoBoks, { type CalloutType } from './InfoBoks'

// Læsevisning af wiki-indhold. Understøtter almindelig markdown
// (overskrifter, tekst, lister, tabeller) PLUS informationsbokse
// skrevet som blockquote-callouts:
//
//   > [!info] Valgfri titel
//   > Brødtekst i boksen
//
// react-markdown renderer IKKE rå HTML (ingen rehype-raw) → XSS-sikkert.

const CALLOUT_TYPER: CalloutType[] = ['info', 'vigtigt', 'advarsel', 'note']

interface Blok {
  slags: 'md' | 'callout'
  type?: CalloutType
  titel?: string
  tekst: string
}

function parseBlokke(indhold: string): Blok[] {
  const linjer = indhold.replace(/\r\n/g, '\n').split('\n')
  const blokke: Blok[] = []
  let mdBuffer: string[] = []

  function skylMd() {
    if (mdBuffer.length) {
      blokke.push({ slags: 'md', tekst: mdBuffer.join('\n') })
      mdBuffer = []
    }
  }

  for (let i = 0; i < linjer.length; i++) {
    const m = linjer[i].match(/^>\s*\[!(\w+)\]\s*(.*)$/)
    const type = m ? (m[1].toLowerCase() as CalloutType) : null
    if (m && type && CALLOUT_TYPER.includes(type)) {
      skylMd()
      const titel = m[2].trim() || undefined
      const body: string[] = []
      i++
      while (i < linjer.length && linjer[i].startsWith('>')) {
        body.push(linjer[i].replace(/^>\s?/, ''))
        i++
      }
      i-- // kompenser for løkkens i++
      blokke.push({ slags: 'callout', type, titel, tekst: body.join('\n') })
    } else {
      mdBuffer.push(linjer[i])
    }
  }
  skylMd()
  return blokke
}

function Md({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
  )
}

export default function MarkdownIndhold({ indhold }: { indhold: string }) {
  const blokke = parseBlokke(indhold ?? '')
  return (
    <div className="wiki-prose">
      {blokke.map((b, idx) =>
        b.slags === 'callout' ? (
          <InfoBoks key={idx} type={b.type!} titel={b.titel}>
            <Md>{b.tekst}</Md>
          </InfoBoks>
        ) : (
          <Md key={idx}>{b.tekst}</Md>
        ),
      )}
    </div>
  )
}
