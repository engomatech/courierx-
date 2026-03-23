/**
 * CMS Pages — /admin/cms
 * Manage public-facing content pages: About Us, Services, Policies, etc.
 * Content is stored in adminStore and rendered on public pages.
 */

import { useState } from 'react'
import { useAdminStore } from '../../adminStore'
import { FileText, Edit2, Eye, Save, X, Globe, CheckCircle2, AlertCircle } from 'lucide-react'

// Default CMS pages that ship with the system
const DEFAULT_PAGES = [
  {
    id: 'cms-about',
    slug: 'about-us',
    title: 'About Us',
    category: 'Company',
    status: 'published',
    content: `Online Express is Zambia's leading courier and logistics company, providing fast and reliable delivery services across the country and internationally.

Founded with the mission to connect businesses and individuals through seamless parcel delivery, we operate a nationwide network of hubs covering all major cities and provinces.

Our Services:
• Domestic parcel delivery (Standard & Express)
• International shipping to over 50 countries
• Freight solutions for heavy cargo
• COD (Cash on Delivery) services
• Door-to-door pickup and delivery

We are committed to transparency, reliability, and customer satisfaction in every shipment we handle.`,
  },
  {
    id: 'cms-air-freight',
    slug: 'air-freight',
    title: 'Air Freight',
    category: 'Services',
    status: 'published',
    content: `Our Air Freight service provides fast, reliable transportation of goods by air for both domestic and international shipments.

Key Features:
• Express air delivery within 24–48 hours domestically
• International air freight to major global destinations
• Real-time shipment tracking
• Door-to-door pickup and delivery
• Customs clearance support

Weight Limits: Up to 500 kg per consignment
Volumetric calculations apply (length × width × height ÷ 5000)

For large cargo or special requirements, please contact our freight team for a custom quote.`,
  },
  {
    id: 'cms-sea-freight',
    slug: 'sea-freight',
    title: 'Sea Freight',
    category: 'Services',
    status: 'published',
    content: `Sea Freight offers an economical solution for large, heavy, or bulk cargo shipments that are not time-critical.

Services:
• Full Container Load (FCL)
• Less than Container Load (LCL)
• Port-to-port and door-to-door options
• Customs brokerage and documentation support

Transit Times: 14–30 days depending on destination
Ideal for: furniture, machinery, vehicles, bulk goods

Our team handles all necessary documentation including Bill of Lading, Packing List, Commercial Invoice, and Certificate of Origin.`,
  },
  {
    id: 'cms-surface-freight',
    slug: 'surface-freight',
    title: 'Surface Freight',
    category: 'Services',
    status: 'published',
    content: `Surface Freight provides reliable road transport solutions for domestic cargo movement across Zambia and neighboring countries.

Coverage:
• All major towns and cities in Zambia
• Cross-border services to Zimbabwe, Tanzania, South Africa, and DRC

Features:
• Dedicated trucks for large consignments
• Shared load (LTL) for smaller cargo
• GPS-tracked vehicles
• Insurance available on request

Transit Times: 1–5 business days depending on destination
Weight: From 30 kg upward (lighter consignments use our parcel service)`,
  },
  {
    id: 'cms-volumetric',
    slug: 'volumetric-weight',
    title: 'Volumetric Weight',
    category: 'Information',
    status: 'published',
    content: `Volumetric weight (also known as dimensional weight) is a pricing technique used in the transport industry to account for the space a package occupies relative to its actual weight.

How to Calculate:
Volumetric Weight = (Length × Width × Height) ÷ 5000
(dimensions in centimetres, result in kilograms)

Example:
A box measuring 40cm × 30cm × 20cm:
40 × 30 × 20 = 24,000 ÷ 5,000 = 4.8 kg volumetric weight

Chargeable Weight:
The chargeable weight is the greater of:
• Actual weight
• Volumetric weight

This means if your package is large but light, you will be charged based on the volumetric weight.

Tip: Pack compactly to minimize volumetric weight and reduce shipping costs.`,
  },
  {
    id: 'cms-fuel-surcharge',
    slug: 'fuel-surcharge',
    title: 'Fuel Surcharge',
    category: 'Information',
    status: 'published',
    content: `A fuel surcharge is an additional fee applied to shipping rates to account for fluctuations in fuel costs.

Current Fuel Surcharge: Please contact our customer service team for the current applicable rate.

How It's Applied:
The fuel surcharge is calculated as a percentage of the base shipping rate and is reviewed monthly based on prevailing fuel prices in Zambia.

Why We Charge It:
Fuel represents a significant portion of our operating costs. The surcharge allows us to maintain stable base rates while adjusting for market fuel price changes transparently.

For corporate accounts with fixed rate agreements, fuel surcharge terms are outlined in your service contract.`,
  },
  {
    id: 'cms-restricted',
    slug: 'restricted-items',
    title: 'Restricted & Banned Items',
    category: 'Policies',
    status: 'published',
    content: `The following items are PROHIBITED from shipping via Online Express under any circumstances:

Absolutely Prohibited:
• Explosives, fireworks, and flammable substances
• Firearms, ammunition, and weapons
• Illegal drugs and narcotics
• Counterfeit goods and pirated materials
• Hazardous chemicals and toxic substances
• Live animals (unless special arrangements made)
• Human remains or ashes
• Currency, negotiable instruments, and bearer bonds

Restricted Items (require declaration and special handling):
• Lithium batteries (standalone)
• Perfumes and aerosols (limited quantity)
• Perishable food items (temperature-controlled service required)
• Medicines and pharmaceuticals (documentation required)
• Alcohol (domestic only, with permit)
• Jewellery and precious stones (declared value required)
• Electronics above ZMW 10,000 value

Customs Declaration:
All international shipments must be accurately declared. Misdeclaration is a customs offense and may result in confiscation, fines, or legal action.

If in doubt about whether your item can be shipped, contact our customer service team before booking.`,
  },
  {
    id: 'cms-privacy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    category: 'Legal',
    status: 'published',
    content: `Last updated: January 2025

Online Express ("we", "our", "us") is committed to protecting your personal information.

Information We Collect:
• Name, address, phone number, and email address
• Shipment details (sender/receiver information)
• Payment information (processed securely, not stored)
• Website usage data (analytics)

How We Use Your Information:
• To process and deliver your shipments
• To communicate shipment status updates
• To improve our services
• To comply with legal obligations

Data Sharing:
We share your information only with:
• Delivery partners required to complete your shipment
• Government and customs authorities as legally required
• Payment processors for transaction processing

Data Retention:
Shipment records are retained for 7 years for accounting and legal compliance. Personal account data is retained while your account is active.

Your Rights:
• Access: Request a copy of your personal data
• Correction: Request correction of inaccurate data
• Deletion: Request deletion (subject to legal retention requirements)

Contact our Data Protection Officer at: privacy@onlineexpress.zm`,
  },
  {
    id: 'cms-terms',
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    category: 'Legal',
    status: 'published',
    content: `Last updated: January 2025

By using Online Express services, you agree to these Terms and Conditions.

1. SERVICE AGREEMENT
Online Express provides courier and logistics services subject to these terms. We reserve the right to refuse shipments that violate our policies.

2. LIABILITY LIMITATIONS
Our liability is limited to ZMW 500 per shipment unless additional insurance is purchased. We are not liable for:
• Indirect or consequential losses
• Delays due to customs, weather, or force majeure
• Damage to improperly packaged items

3. PROHIBITED ITEMS
See our Restricted & Banned Items policy. Shipping prohibited items may result in confiscation and legal action.

4. DELIVERY ATTEMPTS
We make up to 3 delivery attempts. After the 3rd failed attempt, the shipment is returned to sender at the sender's expense.

5. CLAIMS
Claims for loss or damage must be filed within 7 days of the expected delivery date. Claims must include the AWB number and evidence of loss/damage.

6. PAYMENT TERMS
• Prepaid: Payment at booking
• Credit accounts: Payment within 30 days of invoice
• COD: Collected at delivery, remitted within 14 days

7. GOVERNING LAW
These terms are governed by the laws of the Republic of Zambia.

For questions, contact: legal@onlineexpress.zm`,
  },
]

const CATEGORIES = ['All', 'Company', 'Services', 'Information', 'Policies', 'Legal']

const CATEGORY_COLORS = {
  'Company':     'bg-violet-100 text-violet-700',
  'Services':    'bg-blue-100 text-blue-700',
  'Information': 'bg-amber-100 text-amber-700',
  'Policies':    'bg-red-100 text-red-700',
  'Legal':       'bg-slate-100 text-slate-700',
}

export default function CmsPages() {
  const cmsPages      = useAdminStore(s => s.cmsPages)
  const updateCmsPage = useAdminStore(s => s.updateCmsPage)

  // Use stored pages, falling back to defaults for pages not yet customised
  const pages = DEFAULT_PAGES.map(def => {
    const stored = cmsPages?.find(p => p.id === def.id)
    return stored ? { ...def, ...stored } : def
  })

  const [search,      setSearch]      = useState('')
  const [catFilter,   setCatFilter]   = useState('All')
  const [editingPage, setEditingPage] = useState(null)  // page object being edited
  const [editForm,    setEditForm]    = useState(null)
  const [saved,       setSaved]       = useState(null)  // id of last saved page (for flash)

  const filtered = pages.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !search || p.title.toLowerCase().includes(q) || p.slug.includes(q)
    const matchCat = catFilter === 'All' || p.category === catFilter
    return matchSearch && matchCat
  })

  function startEdit(page) {
    setEditingPage(page)
    setEditForm({ title: page.title, content: page.content, status: page.status })
  }

  function handleSave() {
    if (!editingPage || !editForm) return
    updateCmsPage && updateCmsPage(editingPage.id, editForm)
    setSaved(editingPage.id)
    setEditingPage(null)
    setEditForm(null)
    setTimeout(() => setSaved(null), 3000)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mt-1">
            Manage public-facing content pages shown on the customer portal and website.
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-medium">
            <CheckCircle2 size={15} />
            Page saved successfully
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search pages…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                catFilter === c
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border text-slate-600 hover:bg-slate-50'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map(page => (
          <div key={page.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-violet-500" />
                <div>
                  <h3 className="font-semibold text-slate-800">{page.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">/{page.slug}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[page.category] || 'bg-slate-100 text-slate-600'}`}>
                      {page.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      page.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {page.status === 'published' ? '● Published' : '○ Draft'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(page)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors">
                  <Edit2 size={13} /> Edit
                </button>
              </div>
            </div>

            {/* Content preview */}
            <div className="px-5 py-4">
              <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-3">
                {page.content}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {page.content.split('\n').filter(Boolean).length} lines · {page.content.length} characters
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Panel */}
      {editingPage && editForm && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40">
          <div className="w-full max-w-2xl bg-white flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 shrink-0">
              <div>
                <h2 className="font-semibold text-slate-800">Edit: {editingPage.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">/{editingPage.slug}</p>
              </div>
              <button onClick={() => { setEditingPage(null); setEditForm(null) }}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-500">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Page Title</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Content</label>
                <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                  <AlertCircle size={12} />
                  Plain text. Use blank lines to separate paragraphs.
                </div>
                <textarea
                  rows={24}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono resize-none"
                  value={editForm.content}
                  onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50 shrink-0">
              <button onClick={() => { setEditingPage(null); setEditForm(null) }}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium">
                <Save size={14} /> Save Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
