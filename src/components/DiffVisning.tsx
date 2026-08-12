import MarkdownIndhold from './MarkdownIndhold'

interface SideData {
  titel: string
  beskrivelse: string | null
  indhold: string
}

function Felt({ label, gammel, ny }: { label: string; gammel?: string; ny?: string }) {
  const aendret = (gammel ?? '') !== (ny ?? '')
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="smu-eyebrow">{label}</span>
      {aendret && <span className="smu-badge smu-badge-orange">Ændret</span>}
    </div>
  )
}

function Kolonne({ titel, data, tom }: { titel: string; data: SideData | null; tom?: string }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[12px] font-extrabold text-navy mb-2">{titel}</p>
      {data ? (
        <div className="smu-card p-4">
          <p className="text-[16px] font-extrabold text-navy">{data.titel}</p>
          {data.beskrivelse && <p className="smu-meta text-[13px] mt-0.5 mb-2.5">{data.beskrivelse}</p>}
          <div className="border-t border-border-soft pt-2.5">
            <MarkdownIndhold indhold={data.indhold} />
          </div>
        </div>
      ) : (
        <div className="smu-card p-4">
          <p className="smu-meta text-[13px]">{tom}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Sammenligning af eksisterende (venstre) og foreslået (højre) indhold.
 * Ved nye sider vises kun det foreslåede.
 */
export default function DiffVisning({ eksisterende, foreslaaet }: {
  eksisterende: SideData | null
  foreslaaet: SideData
}) {
  const nytSideForslag = eksisterende === null

  return (
    <div>
      {!nytSideForslag && (
        <div className="mb-3 space-y-1">
          <Felt label="Titel" gammel={eksisterende?.titel} ny={foreslaaet.titel} />
          <Felt label="Beskrivelse" gammel={eksisterende?.beskrivelse ?? ''} ny={foreslaaet.beskrivelse ?? ''} />
          <Felt label="Indhold" gammel={eksisterende?.indhold} ny={foreslaaet.indhold} />
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-4">
        {nytSideForslag ? (
          <Kolonne titel="Foreslået ny side" data={foreslaaet} />
        ) : (
          <>
            <Kolonne titel="Nuværende (publiceret)" data={eksisterende} tom="Ingen eksisterende side." />
            <Kolonne titel="Foreslået ændring" data={foreslaaet} />
          </>
        )}
      </div>
    </div>
  )
}
