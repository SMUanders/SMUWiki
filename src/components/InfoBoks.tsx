import type { ReactNode } from 'react'

export type CalloutType = 'info' | 'vigtigt' | 'advarsel' | 'note'

const TITEL: Record<CalloutType, string> = {
  info:     'Info',
  vigtigt:  'Vigtigt',
  advarsel: 'Advarsel',
  note:     'Note',
}

/** Informationsboks brugt i wiki-indhold. Styling defineres i index.css. */
export default function InfoBoks({ type, titel, children }: {
  type: CalloutType
  titel?: string
  children: ReactNode
}) {
  return (
    <div className={`wiki-callout wiki-callout-${type}`}>
      <div className="wiki-callout-titel">{titel ?? TITEL[type]}</div>
      {children}
    </div>
  )
}
