import { Clock } from 'lucide-react'

/** Diskret besked på en side, når der ligger et afventende ændringsforslag. */
export default function ForslagBanner() {
  return (
    <div className="smu-notice smu-notice-warn">
      <Clock size={15} className="shrink-0" />
      <span>Der er indsendt et ændringsforslag, som afventer godkendelse.</span>
    </div>
  )
}
