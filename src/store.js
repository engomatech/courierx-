import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateAWB, generateId } from './utils'

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_SHIPMENTS = [
  {
    awb: 'CX9001234567', status: 'Delivered', serviceType: 'Express',
    sender:   { name: 'TechCorp Inc.',    address: '100 Tech Ave',     city: 'New York',      country: 'USA', phone: '+1-212-555-0101' },
    receiver: { name: 'John Smith',       address: '456 Sunset Blvd',  city: 'Los Angeles',   country: 'USA', phone: '+1-310-555-0202' },
    weight: 3.2, dimensions: { l: 35, w: 25, h: 20 },
    createdAt: '2026-03-01T09:00:00Z', prsId: 'PRS-1001', bagId: 'BAG-1001', manifestId: 'MAN-1001', drsId: 'DRS-1001',
    pod: { recipientName: 'John Smith', mobile: '+1-310-555-0202', notes: 'Left at front door', timestamp: '2026-03-03T14:30:00Z' }, ndr: null,
  },
  {
    awb: 'CX9001234568', status: 'Delivered', serviceType: 'Standard',
    sender:   { name: 'Global Traders',   address: '22 Commerce St',   city: 'Chicago',       country: 'USA', phone: '+1-312-555-0303' },
    receiver: { name: 'Alice Brown',      address: '789 Maple Dr',     city: 'Los Angeles',   country: 'USA', phone: '+1-310-555-0404' },
    weight: 1.8, dimensions: { l: 25, w: 18, h: 12 },
    createdAt: '2026-03-01T10:30:00Z', prsId: 'PRS-1001', bagId: 'BAG-1001', manifestId: 'MAN-1001', drsId: 'DRS-1001',
    pod: { recipientName: 'Alice Brown', mobile: '+1-310-555-0404', notes: 'Signed by recipient', timestamp: '2026-03-03T15:10:00Z' }, ndr: null,
  },
  {
    awb: 'CX9001234569', status: 'Non-Delivery', serviceType: 'Express',
    sender:   { name: 'QuickShop',        address: '5 Market Pl',      city: 'Houston',       country: 'USA', phone: '+1-713-555-0505' },
    receiver: { name: 'Bob Martinez',     address: '321 Unknown Rd',   city: 'Los Angeles',   country: 'USA', phone: '+1-310-555-0606' },
    weight: 0.9, dimensions: { l: 15, w: 10, h: 8 },
    createdAt: '2026-03-01T11:00:00Z', prsId: 'PRS-1001', bagId: 'BAG-1001', manifestId: 'MAN-1001', drsId: 'DRS-1001',
    pod: null, ndr: { reason: 'Address not found', attemptDate: '2026-03-03T16:00:00Z', rescheduleDate: '2026-03-05T10:00:00Z', notes: 'House number does not exist on street' },
  },
  {
    awb: 'CX9001234570', status: 'Out for Delivery', serviceType: 'Standard',
    sender:   { name: 'Retail Hub',       address: '88 Retail Row',    city: 'Phoenix',       country: 'USA', phone: '+1-602-555-0707' },
    receiver: { name: 'Carol Lee',        address: '654 Palm Ave',     city: 'Los Angeles',   country: 'USA', phone: '+1-310-555-0808' },
    weight: 5.5, dimensions: { l: 50, w: 35, h: 30 },
    createdAt: '2026-03-02T08:00:00Z', prsId: 'PRS-1001', bagId: 'BAG-1001', manifestId: 'MAN-1001', drsId: 'DRS-1002',
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234571', status: 'Out for Delivery', serviceType: 'Express',
    sender:   { name: 'E-Store Ltd.',     address: '9 Digital St',     city: 'New York',      country: 'USA', phone: '+1-212-555-0909' },
    receiver: { name: 'Dan Harris',       address: '111 Harbor Blvd',  city: 'Los Angeles',   country: 'USA', phone: '+1-310-555-1010' },
    weight: 2.1, dimensions: { l: 28, w: 20, h: 15 },
    createdAt: '2026-03-02T08:30:00Z', prsId: 'PRS-1002', bagId: 'BAG-1001', manifestId: 'MAN-1001', drsId: 'DRS-1002',
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234572', status: 'Hub Inbound', serviceType: 'Standard',
    sender:   { name: 'Warehouse Plus',   address: '33 Storage Blvd',  city: 'Chicago',       country: 'USA', phone: '+1-312-555-1111' },
    receiver: { name: 'Eve Thompson',     address: '222 Rose Ln',      city: 'Los Angeles',   country: 'USA', phone: '+1-310-555-1212' },
    weight: 4.0, dimensions: { l: 40, w: 30, h: 25 },
    createdAt: '2026-03-02T09:00:00Z', prsId: 'PRS-1002', bagId: 'BAG-1002', manifestId: 'MAN-1001', drsId: null,
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234573', status: 'Hub Inbound', serviceType: 'International',
    sender:   { name: 'Dubai Exports',    address: '1 Trade Tower',    city: 'Dubai',         country: 'UAE', phone: '+971-4-555-1313' },
    receiver: { name: 'Frank Davis',      address: '333 Ocean Dr',     city: 'Los Angeles',   country: 'USA', phone: '+1-310-555-1414' },
    weight: 6.3, dimensions: { l: 55, w: 40, h: 35 },
    createdAt: '2026-03-02T09:30:00Z', prsId: 'PRS-1002', bagId: 'BAG-1002', manifestId: 'MAN-1001', drsId: null,
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234574', status: 'Manifested', serviceType: 'Express',
    sender:   { name: 'Flash Retail',     address: '7 Speed Ave',      city: 'New York',      country: 'USA', phone: '+1-212-555-1515' },
    receiver: { name: 'Grace Kim',        address: '444 Vine St',      city: 'Chicago',       country: 'USA', phone: '+1-312-555-1616' },
    weight: 1.5, dimensions: { l: 20, w: 15, h: 10 },
    createdAt: '2026-03-03T08:00:00Z', prsId: 'PRS-1002', bagId: 'BAG-1003', manifestId: 'MAN-1002', drsId: null,
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234575', status: 'Bagged', serviceType: 'Standard',
    sender:   { name: 'Mega Supply Co.',  address: '12 Supply Rd',     city: 'Houston',       country: 'USA', phone: '+1-713-555-1717' },
    receiver: { name: 'Henry Wilson',     address: '555 Oak St',       city: 'Chicago',       country: 'USA', phone: '+1-312-555-1818' },
    weight: 3.8, dimensions: { l: 38, w: 28, h: 22 },
    createdAt: '2026-03-03T09:00:00Z', prsId: 'PRS-1002', bagId: 'BAG-1003', manifestId: null, drsId: null,
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234576', status: 'Origin Scanned', serviceType: 'Standard',
    sender:   { name: 'Local Sellers',    address: '3 Main St',        city: 'Philadelphia',  country: 'USA', phone: '+1-215-555-1919' },
    receiver: { name: 'Iris Chen',        address: '666 Elm Ave',      city: 'Houston',       country: 'USA', phone: '+1-713-555-2020' },
    weight: 2.2, dimensions: { l: 30, w: 22, h: 16 },
    createdAt: '2026-03-03T10:00:00Z', prsId: 'PRS-1003', bagId: null, manifestId: null, drsId: null,
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234577', status: 'Picked Up', serviceType: 'Express',
    sender:   { name: 'SwiftSend Ltd.',   address: '14 Express Way',   city: 'New York',      country: 'USA', phone: '+1-212-555-2121' },
    receiver: { name: 'Jack Moore',       address: '777 Pine Rd',      city: 'Phoenix',       country: 'USA', phone: '+1-602-555-2222' },
    weight: 0.7, dimensions: { l: 12, w: 10, h: 8 },
    createdAt: '2026-03-04T08:00:00Z', prsId: 'PRS-1003', bagId: null, manifestId: null, drsId: null,
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234578', status: 'PRS Assigned', serviceType: 'Standard',
    sender:   { name: 'Bulk Orders Inc.', address: '20 Industry Blvd', city: 'Chicago',       country: 'USA', phone: '+1-312-555-2323' },
    receiver: { name: 'Karen White',      address: '888 Birch Ln',     city: 'Philadelphia',  country: 'USA', phone: '+1-215-555-2424' },
    weight: 7.1, dimensions: { l: 60, w: 45, h: 40 },
    createdAt: '2026-03-05T08:00:00Z', prsId: 'PRS-1004', bagId: null, manifestId: null, drsId: null,
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234579', status: 'PRS Assigned', serviceType: 'International',
    sender:   { name: 'London Boutique',  address: '5 Oxford St',      city: 'London',        country: 'UK', phone: '+44-20-5555-2525' },
    receiver: { name: 'Liam Anderson',    address: '999 Cedar Blvd',   city: 'New York',      country: 'USA', phone: '+1-212-555-2626' },
    weight: 2.9, dimensions: { l: 32, w: 24, h: 18 },
    createdAt: '2026-03-05T09:00:00Z', prsId: 'PRS-1004', bagId: null, manifestId: null, drsId: null,
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234580', status: 'Booked', serviceType: 'Express',
    sender:   { name: 'Fast Fashion Co.', address: '40 Style Ave',     city: 'Los Angeles',   country: 'USA', phone: '+1-310-555-2727' },
    receiver: { name: 'Mia Taylor',       address: '100 Willow Way',   city: 'Chicago',       country: 'USA', phone: '+1-312-555-2828' },
    weight: 1.3, dimensions: { l: 22, w: 16, h: 10 },
    createdAt: '2026-03-06T10:00:00Z', prsId: null, bagId: null, manifestId: null, drsId: null,
    pod: null, ndr: null,
  },
  {
    awb: 'CX9001234581', status: 'Booked', serviceType: 'Standard',
    sender:   { name: 'Green Goods Ltd.', address: '8 Eco Park',       city: 'Houston',       country: 'USA', phone: '+1-713-555-2929' },
    receiver: { name: 'Noah Garcia',      address: '200 Riverfront',   city: 'Phoenix',       country: 'USA', phone: '+1-602-555-3030' },
    weight: 4.4, dimensions: { l: 44, w: 33, h: 28 },
    createdAt: '2026-03-07T09:00:00Z', prsId: null, bagId: null, manifestId: null, drsId: null,
    pod: null, ndr: null,
  },
]

const SEED_PRS = [
  {
    id: 'PRS-1001', status: 'Completed', country: 'USA', city: 'New York', hub: 'JFK Hub',
    routeCode: 'RT-001', driver: 'Mike Wilson',
    shipments: ['CX9001234567', 'CX9001234568', 'CX9001234569'],
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'PRS-1002', status: 'Completed', country: 'USA', city: 'Chicago', hub: 'ORD Hub',
    routeCode: 'RT-003', driver: 'Sarah Chen',
    shipments: ['CX9001234570', 'CX9001234571', 'CX9001234572', 'CX9001234573', 'CX9001234574', 'CX9001234575'],
    createdAt: '2026-03-02T07:30:00Z',
  },
  {
    id: 'PRS-1003', status: 'Completed', country: 'USA', city: 'Philadelphia', hub: 'PHL Hub',
    routeCode: 'RT-006', driver: 'Emma Davis',
    shipments: ['CX9001234576', 'CX9001234577'],
    createdAt: '2026-03-03T08:00:00Z',
  },
  {
    id: 'PRS-1004', status: 'Proceed', country: 'USA', city: 'Chicago', hub: 'ORD Hub',
    routeCode: 'RT-002', driver: 'David Kumar',
    shipments: ['CX9001234578', 'CX9001234579'],
    createdAt: '2026-03-05T07:30:00Z',
  },
]

const SEED_BAGS = [
  {
    id: 'BAG-1001', destination: 'Los Angeles', mode: 'Domestic',
    shipments: ['CX9001234567', 'CX9001234568', 'CX9001234569', 'CX9001234570', 'CX9001234571'],
    status: 'Manifested', createdAt: '2026-03-02T12:00:00Z',
  },
  {
    id: 'BAG-1002', destination: 'Los Angeles', mode: 'International',
    shipments: ['CX9001234572', 'CX9001234573'],
    status: 'Manifested', createdAt: '2026-03-02T14:00:00Z',
  },
  {
    id: 'BAG-1003', destination: 'Chicago', mode: 'Domestic',
    shipments: ['CX9001234574', 'CX9001234575'],
    status: 'Closed', createdAt: '2026-03-03T13:00:00Z',
  },
]

const SEED_MANIFESTS = [
  {
    id: 'MAN-1001', type: 'Bag', bags: ['BAG-1001', 'BAG-1002'], shipments: [],
    transporter: 'AirCargo Express', origin: 'JFK Hub', destination: 'LAX Hub',
    status: 'Arrived', createdAt: '2026-03-02T16:00:00Z',
    dispatchedAt: '2026-03-02T18:00:00Z', arrivedAt: '2026-03-03T10:00:00Z',
  },
  {
    id: 'MAN-1002', type: 'Bag', bags: ['BAG-1003'], shipments: [],
    transporter: 'FastFreight Co.', origin: 'ORD Hub', destination: 'CHI Hub',
    status: 'Dispatched', createdAt: '2026-03-04T10:00:00Z',
    dispatchedAt: '2026-03-04T14:00:00Z', arrivedAt: null,
  },
]

const SEED_DRS = [
  {
    id: 'DRS-1001', driver: 'James Brown', hub: 'LAX Hub', routeCode: 'RT-005',
    shipments: ['CX9001234567', 'CX9001234568', 'CX9001234569'],
    status: 'Completed', createdAt: '2026-03-03T08:00:00Z',
  },
  {
    id: 'DRS-1002', driver: 'Lisa Zhang', hub: 'LAX Hub', routeCode: 'RT-004',
    shipments: ['CX9001234570', 'CX9001234571'],
    status: 'In Progress', createdAt: '2026-03-07T08:00:00Z',
  },
]

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStore = create(
  persist(
    (set, get) => ({
      shipments:      SEED_SHIPMENTS,
      discrepancies:  [],
      prs:            SEED_PRS,
      bags:      SEED_BAGS,
      manifests: SEED_MANIFESTS,
      drs:       SEED_DRS,

      // ── Shipment ──────────────────────────────────────────────────────────
      addShipment: (data) => {
        const newShipment = {
          awb: generateAWB(),
          status: 'Booked',
          ...data,
          prsId: null, bagId: null, manifestId: null, drsId: null,
          pod: null, ndr: null,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ shipments: [...s.shipments, newShipment] }))
        return newShipment.awb
      },

      updateShipmentStatus: (awb, status, extra = {}) => {
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.awb === awb ? { ...sh, status, ...extra } : sh
          ),
        }))
        // Fire notification for key milestones (non-blocking, best-effort)
        const NOTIFY_EVENTS = {
          'Out for Delivery': 'out_for_delivery',
          'Delivered'        : 'delivered',
          'Delivery Failed'  : 'delivery_failed',
          'NDR'              : 'delivery_failed',
          'Return'           : 'return',
        }
        const event = NOTIFY_EVENTS[status]
        if (event) {
          fetch('/api/v1/admin/notifications/send', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ event, awb, details: extra }),
          }).catch(() => {}) // silent fail — notifications are best-effort
        }
      },

      // ── PRS ───────────────────────────────────────────────────────────────
      createPRS: (data) => {
        const id = generateId('PRS')
        const newPRS = { id, status: 'Pending', shipments: [], createdAt: new Date().toISOString(), ...data }
        set((s) => ({ prs: [...s.prs, newPRS] }))
        return id
      },

      addShipmentsToPRS: (prsId, awbs) => {
        set((s) => ({
          prs: s.prs.map((p) =>
            p.id === prsId ? { ...p, shipments: [...new Set([...p.shipments, ...awbs])] } : p
          ),
          shipments: s.shipments.map((sh) =>
            awbs.includes(sh.awb) ? { ...sh, status: 'PRS Assigned', prsId } : sh
          ),
        }))
      },

      updatePRSStatus: (prsId, status) => {
        const prs = get().prs.find((p) => p.id === prsId)
        if (!prs) return
        let shipmentStatus = null
        if (status === 'Proceed')   shipmentStatus = 'Out for Pickup'
        if (status === 'Completed') shipmentStatus = 'Picked Up'
        set((s) => ({
          prs: s.prs.map((p) => p.id === prsId ? { ...p, status } : p),
          shipments: shipmentStatus
            ? s.shipments.map((sh) =>
                prs.shipments.includes(sh.awb) ? { ...sh, status: shipmentStatus } : sh
              )
            : s.shipments,
        }))
      },

      // ── Origin Inbound Scan ───────────────────────────────────────────────
      originInboundScan: (awb) => {
        const sh = get().shipments.find((s) => s.awb === awb)
        if (!sh) return { ok: false, msg: `AWB ${awb} not found` }
        if (sh.status !== 'Picked Up') return { ok: false, msg: `Status is "${sh.status}" — must be Picked Up` }
        set((s) => ({
          shipments: s.shipments.map((s2) =>
            s2.awb === awb ? { ...s2, status: 'Origin Scanned' } : s2
          ),
        }))
        return { ok: true, msg: `${awb} scanned at origin` }
      },

      // ── Bags ─────────────────────────────────────────────────────────────
      createBag: (data) => {
        const id = generateId('BAG')
        const newBag = { id, status: 'Open', shipments: [], createdAt: new Date().toISOString(), ...data }
        set((s) => ({ bags: [...s.bags, newBag] }))
        return id
      },

      addShipmentsToBag: (bagId, awbs) => {
        const bag = get().bags.find((b) => b.id === bagId)
        if (!bag) return
        set((s) => ({
          bags: s.bags.map((b) =>
            b.id === bagId ? { ...b, shipments: [...new Set([...b.shipments, ...awbs])] } : b
          ),
          shipments: s.shipments.map((sh) =>
            awbs.includes(sh.awb) ? { ...sh, status: 'Bagged', bagId } : sh
          ),
        }))
      },

      closeBag: (bagId) =>
        set((s) => ({
          bags: s.bags.map((b) => b.id === bagId ? { ...b, status: 'Closed' } : b),
        })),

      // ── Manifests ─────────────────────────────────────────────────────────
      createManifest: (data) => {
        const id = generateId('MAN')
        const newManifest = {
          id, status: 'Open', createdAt: new Date().toISOString(),
          dispatchedAt: null, arrivedAt: null, ...data,
        }
        // mark bags as manifested
        const { bags: bagIds = [], shipments: directAwbs = [] } = data
        set((s) => ({
          manifests: [...s.manifests, newManifest],
          bags: s.bags.map((b) =>
            bagIds.includes(b.id) ? { ...b, status: 'Manifested' } : b
          ),
          shipments: s.shipments.map((sh) => {
            if (directAwbs.includes(sh.awb)) return { ...sh, status: 'Manifested', manifestId: id }
            // shipments inside those bags
            const inBag = s.bags.filter((b) => bagIds.includes(b.id)).flatMap((b) => b.shipments)
            if (inBag.includes(sh.awb)) return { ...sh, status: 'Manifested', manifestId: id }
            return sh
          }),
        }))
        return id
      },

      dispatchManifest: (manifestId) =>
        set((s) => ({
          manifests: s.manifests.map((m) =>
            m.id === manifestId ? { ...m, status: 'Dispatched', dispatchedAt: new Date().toISOString() } : m
          ),
        })),

      // ── Hub Inbound Scan ─────────────────────────────────────────────────
      hubInboundScan: (input) => {
        const { shipments, bags, manifests } = get()
        // Could be AWB or Bag ID
        const bag = bags.find((b) => b.id === input)
        if (bag) {
          const awbs = bag.shipments
          // Detect unexpected bag — not listed in any manifest
          const inManifest = manifests.some((m) => m.bags.includes(bag.id))
          const newDisc = !inManifest ? [{
            id: generateId('DISC'),
            type: 'unexpected_bag',
            bagId: bag.id, awb: null, manifestId: null,
            status: 'open',
            detectedAt: new Date().toISOString(),
            resolvedAt: null, resolvedBy: null, resolution: null,
            notes: `Bag ${bag.id} scanned at hub but not found in any manifest`,
          }] : []
          set((s) => ({
            bags: s.bags.map((b) => b.id === input ? { ...b, status: 'Hub Scanned' } : b),
            shipments: s.shipments.map((sh) =>
              awbs.includes(sh.awb) ? { ...sh, status: 'Hub Inbound' } : sh
            ),
            discrepancies: [...s.discrepancies, ...newDisc],
          }))
          const warn = !inManifest ? ' ⚠ Not in any manifest' : ''
          return { ok: !inManifest ? false : true, msg: `Bag ${input} scanned — ${awbs.length} shipments updated${warn}` }
        }
        const sh = shipments.find((s) => s.awb === input)
        if (!sh) return { ok: false, msg: `${input} not found` }
        if (!['Manifested', 'Hub Inbound'].includes(sh.status)) {
          return { ok: false, msg: `Status "${sh.status}" cannot be hub-scanned` }
        }
        // Detect unexpected direct shipment — not in any manifest
        const inManifest = manifests.some((m) => (m.shipments || []).includes(sh.awb))
        const inBag = bags.some((b) => b.shipments.includes(sh.awb))
        const newDisc = (!inManifest && !inBag) ? [{
          id: generateId('DISC'),
          type: 'unexpected_shipment',
          awb: sh.awb, bagId: null, manifestId: null,
          status: 'open',
          detectedAt: new Date().toISOString(),
          resolvedAt: null, resolvedBy: null, resolution: null,
          notes: `AWB ${sh.awb} scanned at hub but not listed in any manifest`,
        }] : []
        set((s) => ({
          shipments: s.shipments.map((s2) =>
            s2.awb === input ? { ...s2, status: 'Hub Inbound' } : s2
          ),
          discrepancies: [...s.discrepancies, ...newDisc],
        }))
        return { ok: true, msg: `${input} marked Hub Inbound` }
      },

      arriveManifest: (manifestId) => {
        const { manifests, bags, shipments } = get()
        const manifest = manifests.find((m) => m.id === manifestId)
        if (!manifest) return
        const allBagShipments = bags
          .filter((b) => manifest.bags.includes(b.id))
          .flatMap((b) => b.shipments)
        const allAwbs = [...allBagShipments, ...(manifest.shipments || [])]

        // Detect missing bags — in manifest but not yet hub-scanned
        const missingBagDiscs = manifest.bags
          .filter((bagId) => {
            const b = bags.find((x) => x.id === bagId)
            return b && b.status !== 'Hub Scanned'
          })
          .map((bagId) => ({
            id: generateId('DISC'),
            type: 'missing_bag',
            bagId, awb: null, manifestId,
            status: 'open',
            detectedAt: new Date().toISOString(),
            resolvedAt: null, resolvedBy: null, resolution: null,
            notes: `Bag ${bagId} listed in manifest ${manifestId} but not scanned at hub`,
          }))

        // Detect missing direct shipments — in manifest.shipments but not hub-scanned
        const missingShipmentDiscs = (manifest.shipments || [])
          .filter((awb) => {
            const sh = shipments.find((x) => x.awb === awb)
            return sh && sh.status !== 'Hub Inbound'
          })
          .map((awb) => ({
            id: generateId('DISC'),
            type: 'missing_shipment',
            awb, bagId: null, manifestId,
            status: 'open',
            detectedAt: new Date().toISOString(),
            resolvedAt: null, resolvedBy: null, resolution: null,
            notes: `AWB ${awb} listed in manifest ${manifestId} but not scanned at hub`,
          }))

        set((s) => ({
          manifests: s.manifests.map((m) =>
            m.id === manifestId ? { ...m, status: 'Arrived', arrivedAt: new Date().toISOString() } : m
          ),
          bags: s.bags.map((b) =>
            manifest.bags.includes(b.id) ? { ...b, status: 'Hub Scanned' } : b
          ),
          shipments: s.shipments.map((sh) =>
            allAwbs.includes(sh.awb) ? { ...sh, status: 'Hub Inbound' } : sh
          ),
          discrepancies: [...s.discrepancies, ...missingBagDiscs, ...missingShipmentDiscs],
        }))
      },

      // ── Discrepancy Resolution ────────────────────────────────────────────
      resolveDiscrepancy: (discId, resolution, notes, resolvedBy) =>
        set((s) => ({
          discrepancies: s.discrepancies.map((d) =>
            d.id === discId
              ? { ...d, status: 'resolved', resolution, notes: notes || d.notes,
                  resolvedAt: new Date().toISOString(), resolvedBy: resolvedBy || 'Ops' }
              : d
          ),
        })),

      // ── DRS ───────────────────────────────────────────────────────────────
      createDRS: (data) => {
        const id = generateId('DRS')
        const newDRS = { id, status: 'Pending', shipments: [], createdAt: new Date().toISOString(), ...data }
        set((s) => ({
          drs: [...s.drs, newDRS],
          shipments: s.shipments.map((sh) =>
            (data.shipments || []).includes(sh.awb)
              ? { ...sh, status: 'DRS Assigned', drsId: id }
              : sh
          ),
        }))
        return id
      },

      startDRS: (drsId) => {
        const drs = get().drs.find((d) => d.id === drsId)
        if (!drs) return
        set((s) => ({
          drs: s.drs.map((d) => d.id === drsId ? { ...d, status: 'In Progress' } : d),
          shipments: s.shipments.map((sh) =>
            drs.shipments.includes(sh.awb) ? { ...sh, status: 'Out for Delivery' } : sh
          ),
        }))
      },

      // ── POD / NDR ─────────────────────────────────────────────────────────
      recordPOD: (awb, podData) => {
        const timestamp = new Date().toISOString()
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.awb === awb
              ? { ...sh, status: 'Delivered', pod: { ...podData, timestamp } }
              : sh
          ),
          drs: s.drs.map((d) => {
            if (!d.shipments.includes(awb)) return d
            const allDone = d.shipments.every((a) => {
              const s2 = s.shipments.find((x) => x.awb === a)
              return a === awb || (s2 && ['Delivered', 'Non-Delivery'].includes(s2.status))
            })
            return allDone ? { ...d, status: 'Completed' } : d
          }),
        }))

        // Persist POD to backend (non-blocking — best-effort)
        fetch(`/api/v1/admin/pod/${awb}`, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({
            recipient_name  : podData.recipientName,
            recipient_mobile: podData.mobile,
            notes           : podData.notes,
            signature_data  : podData.signatureData,
            photo_data      : podData.photoData,
            recorded_by     : 'ops',
          }),
        }).catch(() => {}) // silent fail — local state is source of truth for ops UI
      },

      recordNDR: (awb, ndrData) =>
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.awb === awb
              ? { ...sh, status: 'Non-Delivery', ndr: { ...ndrData, attemptDate: new Date().toISOString() } }
              : sh
          ),
        })),

      // ── Reset ─────────────────────────────────────────────────────────────
      resetToDemo: () =>
        set({ shipments: SEED_SHIPMENTS, prs: SEED_PRS, bags: SEED_BAGS, manifests: SEED_MANIFESTS, drs: SEED_DRS, discrepancies: [] }),
    }),
    { name: 'online-express-store' }
  )
)
