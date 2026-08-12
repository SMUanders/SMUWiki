import ForslagForm from '../components/ForslagForm'

export default function NytForslag() {
  return (
    <ForslagForm
      type="ny_side"
      pageId={null}
      overskrift="Foreslå en ny side"
      initial={{ titel: '', beskrivelse: '', indhold: '', kategori_ids: [] }}
    />
  )
}
