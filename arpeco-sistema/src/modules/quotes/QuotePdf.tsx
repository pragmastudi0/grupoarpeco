import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatARS } from '@/shared/lib/money'
import { formatDate } from '@/shared/lib/format'
import type { QuoteItem } from './queries'

/**
 * Documento comercial A4 (Q05). SÓLO campos públicos aprobados: ni costo
 * estimado, ni notas internas, ni margen. Es la única proyección pública.
 */

export interface QuotePdfData {
  commercial_no: string | null
  title: string
  issued_on: string | null
  valid_until: string | null
  total: number
  public_notes: string | null
  client_name: string
  business_name: string
  business_tax_id?: string
  business_contact?: string
  business_address?: string
  items: Pick<QuoteItem, 'position' | 'description' | 'quantity' | 'unit_price' | 'subtotal'>[]
}

const BLUE = '#3352d6'
const INK = '#0e1726'
const MUTED = '#667386'
const LINE = '#dfe4ec'

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: INK, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: BLUE, letterSpacing: 2 },
  docMeta: { textAlign: 'right' },
  docNo: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  muted: { color: MUTED },
  section: { marginBottom: 16 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 6 },
  cDesc: { flex: 1 },
  cQty: { width: 60, textAlign: 'right' },
  cPrice: { width: 90, textAlign: 'right' },
  cSub: { width: 100, textAlign: 'right' },
  thead: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: INK, paddingVertical: 6 },
  th: { fontFamily: 'Helvetica-Bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalBox: { backgroundColor: BLUE, color: '#fff', padding: 10, borderRadius: 4 },
  notes: { marginTop: 20, padding: 10, backgroundColor: '#f5f7fa', borderRadius: 4 },
})

export function QuotePdf({ data }: { data: QuotePdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>{data.business_name.toUpperCase()}</Text>
            {data.business_tax_id && <Text style={s.muted}>CUIT {data.business_tax_id}</Text>}
            {data.business_address && <Text style={s.muted}>{data.business_address}</Text>}
            {data.business_contact && <Text style={s.muted}>{data.business_contact}</Text>}
          </View>
          <View style={s.docMeta}>
            <Text style={s.docNo}>Presupuesto {data.commercial_no ?? ''}</Text>
            {data.issued_on && <Text style={s.muted}>Emitido: {formatDate(data.issued_on)}</Text>}
            {data.valid_until && (
              <Text style={s.muted}>Válido hasta: {formatDate(data.valid_until)}</Text>
            )}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.muted}>Cliente</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.client_name}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.title}>{data.title}</Text>
        </View>

        <View style={s.thead}>
          <Text style={[s.cDesc, s.th]}>Concepto</Text>
          <Text style={[s.cQty, s.th]}>Cant.</Text>
          <Text style={[s.cPrice, s.th]}>P. unit.</Text>
          <Text style={[s.cSub, s.th]}>Subtotal</Text>
        </View>
        {data.items.map((it) => (
          <View key={it.position} style={s.row} wrap={false}>
            <Text style={s.cDesc}>{it.description}</Text>
            <Text style={s.cQty}>{it.quantity}</Text>
            <Text style={s.cPrice}>{formatARS(it.unit_price)}</Text>
            <Text style={s.cSub}>{formatARS(it.subtotal)}</Text>
          </View>
        ))}

        <View style={s.totalRow}>
          <View style={s.totalBox}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 12 }}>
              Total: {formatARS(data.total)}
            </Text>
          </View>
        </View>

        {data.public_notes && (
          <View style={s.notes}>
            <Text style={s.muted}>Condiciones</Text>
            <Text>{data.public_notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
