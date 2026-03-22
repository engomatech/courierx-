const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
        PageNumber, Footer, Header, LevelFormat, PageBreak } = require('docx');
const fs = require('fs');

// Colors
const BLUE_HEADER = "1F4E79";
const LIGHT_BLUE = "D6E4F0";
const MED_BLUE = "AEC6CF";
const GREEN_LIGHT = "E8F5E9";
const GRAY_LIGHT = "F5F5F5";
const WHITE = "FFFFFF";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const thickBorder = { style: BorderStyle.SINGLE, size: 4, color: "1F4E79" };
const thickBorders = { top: thickBorder, bottom: thickBorder, left: thickBorder, right: thickBorder };

function cell(text, opts = {}) {
  const { bold = false, fill = WHITE, color = "000000", colSpan, width = 2340, center = false } = opts;
  const c = new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    ...(colSpan ? { columnSpan: colSpan } : {}),
    children: [new Paragraph({
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text: String(text), bold, color, font: "Arial", size: 18 })]
    })]
  });
  return c;
}

function headerCell(text, width = 2340) {
  return cell(text, { bold: true, fill: BLUE_HEADER, color: "FFFFFF", width });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 28, color: BLUE_HEADER })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 22, color: "2E75B6" })]
  });
}

function para(text, opts = {}) {
  const { bold = false, color = "333333", size = 20, spacing = { before: 60, after: 60 } } = opts;
  return new Paragraph({
    spacing,
    children: [new TextRun({ text, bold, font: "Arial", size, color })]
  });
}

function tcPara(tcId, steps, expected) {
  return [
    new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [new TextRun({ text: tcId, bold: true, font: "Arial", size: 20, color: BLUE_HEADER })]
    }),
    ...steps.map(s => new Paragraph({
      spacing: { before: 20, after: 20 },
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: s, font: "Arial", size: 18, color: "444444" })]
    })),
    new Paragraph({
      spacing: { before: 20, after: 80 },
      children: [
        new TextRun({ text: "Expected: ", bold: true, font: "Arial", size: 18, color: "1A7A3C" }),
        new TextRun({ text: expected, font: "Arial", size: 18, color: "1A7A3C" })
      ]
    }),
  ];
}

function blueRule() {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 } },
    children: []
  });
}

function noteBox(label, text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: label + " ", bold: true, font: "Arial", size: 18, color: "666666" }),
      new TextRun({ text, font: "Arial", size: 18, color: "444444" })
    ]
  });
}

function codeBlock(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: 360 },
    shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
    children: [new TextRun({ text, font: "Courier New", size: 18, color: "1A1A1A" })]
  });
}

// ── SECTION 1 DATA ─────────────────────────────────────
const testAccountsTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1560, 2800, 1400, 3600],
  rows: [
    new TableRow({ tableHeader: true, children: [
      headerCell("Role", 1560), headerCell("Email", 2800), headerCell("Password", 1400), headerCell("Access", 3600)
    ]}),
    new TableRow({ children: [
      cell("Admin", { fill: LIGHT_BLUE, bold: true, width: 1560 }),
      cell("admin@onlineexpress.com", { width: 2800 }),
      cell("admin123", { width: 1400 }),
      cell("Full platform — admin panel + ops pipeline", { width: 3600 })
    ]}),
    new TableRow({ children: [
      cell("Operations", { fill: GRAY_LIGHT, width: 1560 }),
      cell("ops@onlineexpress.com", { width: 2800 }),
      cell("ops123", { width: 1400 }),
      cell("Ops pipeline only (/ops/*)", { width: 3600 })
    ]}),
    new TableRow({ children: [
      cell("Customer", { fill: LIGHT_BLUE, width: 1560 }),
      cell("customer@example.com", { width: 2800 }),
      cell("cust123", { width: 1400 }),
      cell("Customer portal (/portal/*)", { width: 3600 })
    ]}),
    new TableRow({ children: [
      cell("Driver", { fill: GRAY_LIGHT, width: 1560 }),
      cell("james@onlineexpress.com", { width: 2800 }),
      cell("driver123", { width: 1400 }),
      cell("Driver app — DRS-1001 (completed run)", { width: 3600 })
    ]}),
    new TableRow({ children: [
      cell("Driver", { fill: LIGHT_BLUE, width: 1560 }),
      cell("lisa@onlineexpress.com", { width: 2800 }),
      cell("driver123", { width: 1400 }),
      cell("Driver app — DRS-1002 (in-progress, active stops)", { width: 3600 })
    ]}),
  ]
});

const shipmentsTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2100, 2060, 1400, 3800],
  rows: [
    new TableRow({ tableHeader: true, children: [
      headerCell("AWB", 2100), headerCell("Status", 2060), headerCell("Service", 1400), headerCell("Notes", 3800)
    ]}),
    ...([
      ["CX9001234567","Delivered","Express","DRS-1001 — has POD"],
      ["CX9001234568","Delivered","Standard","DRS-1001 — has POD"],
      ["CX9001234569","Non-Delivery","Express","DRS-1001 — has NDR"],
      ["CX9001234570","Out for Delivery","Standard","DRS-1002 — Lisa Zhang active"],
      ["CX9001234571","Out for Delivery","Express","DRS-1002 — Lisa Zhang active"],
      ["CX9001234572","Hub Inbound","Standard","—"],
      ["CX9001234573","Hub Inbound","International","—"],
      ["CX9001234574","Manifested","Express","MAN-1002"],
      ["CX9001234575","Bagged","Standard","BAG-1003"],
      ["CX9001234576","Origin Scanned","Standard","PHL Hub"],
      ["CX9001234577","Picked Up","Express","PHL Hub"],
      ["CX9001234578","PRS Assigned","Standard","PRS-1004"],
      ["CX9001234579","PRS Assigned","International","PRS-1004"],
      ["CX9001234580","Booked","Express","Ready for PRS"],
      ["CX9001234581","Booked","Standard","Ready for PRS"],
    ].map((r, i) => new TableRow({ children: [
      cell(r[0], { fill: i%2===0?GRAY_LIGHT:WHITE, width: 2100 }),
      cell(r[1], { fill: i%2===0?GRAY_LIGHT:WHITE, width: 2060 }),
      cell(r[2], { fill: i%2===0?GRAY_LIGHT:WHITE, width: 1400 }),
      cell(r[3], { fill: i%2===0?GRAY_LIGHT:WHITE, width: 3800 }),
    ]})))
  ]
});

const opsRecordsTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1400, 1800, 6160],
  rows: [
    new TableRow({ tableHeader: true, children: [
      headerCell("Type", 1400), headerCell("ID", 1800), headerCell("Key Details", 6160)
    ]}),
    ...([
      ["PRS","PRS-1001","Completed — 3 shipments — JFK Hub — Mike Wilson"],
      ["PRS","PRS-1002","Completed — 6 shipments — ORD Hub — Sarah Chen"],
      ["PRS","PRS-1003","Completed — 2 shipments — PHL Hub — Emma Davis"],
      ["PRS","PRS-1004","Proceed — 2 shipments — ORD Hub — David Kumar"],
      ["Bag","BAG-1001","Manifested — 5 shipments — Domestic — Los Angeles"],
      ["Bag","BAG-1002","Manifested — 2 shipments — International — Los Angeles"],
      ["Bag","BAG-1003","Closed — 2 shipments — Domestic — Chicago"],
      ["Manifest","MAN-1001","Arrived — BAG-1001 + BAG-1002 — JFK to LAX"],
      ["Manifest","MAN-1002","Dispatched — BAG-1003 — ORD to CHI"],
      ["DRS","DRS-1001","Completed — James Brown — LAX Hub — RT-005 — 3 stops"],
      ["DRS","DRS-1002","In Progress — Lisa Zhang — LAX Hub — RT-004 — 2 active stops"],
    ].map((r, i) => new TableRow({ children: [
      cell(r[0], { fill: i%2===0?GRAY_LIGHT:WHITE, bold: true, width: 1400 }),
      cell(r[1], { fill: i%2===0?GRAY_LIGHT:WHITE, width: 1800 }),
      cell(r[2], { fill: i%2===0?GRAY_LIGHT:WHITE, width: 6160 }),
    ]})))
  ]
});

const featureSummaryTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2800, 2560, 1200, 2800],
  rows: [
    new TableRow({ tableHeader: true, children: [
      headerCell("Feature", 2800), headerCell("Location", 2560), headerCell("Status", 1200), headerCell("Notes", 2800)
    ]}),
    ...([
      ["New Shipment Booking","/ops/booking","Complete","Prohibited items modal, 2-step form"],
      ["Thermal Label Printing","/ops/booking","Complete","Live preview + browser print + ZPL download"],
      ["PRS Management","/ops/prs","Complete","Create, assign shipments, view details"],
      ["Inbound Scanning","/ops/inbound-scan","Complete","Barcode scanner input, duplicate detection"],
      ["Bag Management","/ops/bags","Complete","Create, add parcels, seal bags"],
      ["Manifest Management","/ops/manifests","Complete","Create, dispatch, arrive; discrepancy trigger"],
      ["Hub Inbound Scanning","/ops/hub-inbound","Complete","Scan manifested parcels + report exceptions"],
      ["DRS Management","/ops/drs","Complete","Create runs, assign drivers, start/complete"],
      ["Delivery — POD","/ops/delivery","Complete","Signature pad, photo, recipient name"],
      ["Delivery — NDR","/ops/delivery","Complete","Reason selection, status update"],
      ["Discrepancies","/ops/discrepancies","Complete","Auto-detect missing shipments; red nav badge"],
      ["Exceptions","/ops/exceptions","Complete","Report damage/loss; escalate/resolve; orange badge"],
      ["Driver App","/driver","Complete","Mobile DRS view, inline POD/NDR, touch signature"],
      ["Partner Orders","/ops/partner-orders","Complete","SQLite-backed shipments with POD drawer"],
      ["Notification Settings","/admin/settings/notifications","Complete","Per-event email toggles; persisted to SQLite"],
      ["SMTP Configuration","/admin/settings/smtp","Complete","Configure mail server, send test email"],
      ["Partner API Keys","/admin/settings/api-keys","Complete","Generate/revoke API keys"],
      ["User Management","/admin/users","Complete","Create/edit/deactivate; role assignment"],
      ["Customer Portal","/portal","Complete","Dashboard, shipments, rate calculator, wallet"],
      ["Public Shipment Tracking","/track","Complete","Timeline view, no login required"],
      ["RBAC","All routes","Complete","Admin / Operations / Customer / Driver isolation"],
    ].map((r, i) => new TableRow({ children: [
      cell(r[0], { fill: i%2===0?GRAY_LIGHT:WHITE, bold: true, width: 2800 }),
      cell(r[1], { fill: i%2===0?GRAY_LIGHT:WHITE, width: 2560 }),
      cell(r[2], { fill: i%2===0?GREEN_LIGHT:GREEN_LIGHT, color: "1A7A3C", bold: true, width: 1200 }),
      cell(r[3], { fill: i%2===0?GRAY_LIGHT:WHITE, width: 2800 }),
    ]})))
  ]
});

// ── BUILD DOCUMENT ──────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE_HEADER },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
    ]
  },
  sections: [
    // ── COVER PAGE ──────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        new Paragraph({ spacing: { before: 2880, after: 0 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 240 },
          children: [new TextRun({ text: "ONLINE EXPRESS", bold: true, font: "Arial", size: 64, color: BLUE_HEADER })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 160 },
          children: [new TextRun({ text: "System Review & Testing Guide", bold: false, font: "Arial", size: 36, color: "2E75B6" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 480 },
          children: [new TextRun({ text: "Internal QA & Acceptance Testing Document", font: "Arial", size: 24, color: "666666" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6", space: 1 }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6", space: 1 } },
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: "March 2026", bold: true, font: "Arial", size: 26, color: BLUE_HEADER })]
        }),
        new Paragraph({ spacing: { before: 480, after: 80 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Production URL: http://163.245.221.133", font: "Arial", size: 20, color: "444444" })] }),
        new Paragraph({ spacing: { before: 0, after: 80 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "GitHub: engomatech/courierx-", font: "Arial", size: 20, color: "444444" })] }),
        new Paragraph({ children: [new PageBreak()] }),
      ]
    },
    // ── MAIN CONTENT ────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
        }
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Online Express — System Review & Testing Guide   |   Page ", font: "Arial", size: 16, color: "888888" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "888888" }),
            ]
          })]
        })
      },
      children: [

        // ── SECTION 1: PLATFORM OVERVIEW ──────────────
        h1("1. Platform Overview"),
        blueRule(),
        para("Online Express is a full-stack courier management platform covering the complete last-mile operations pipeline — from booking through pickup, bagging, manifesting, hub inbound, delivery route assignment, and proof of delivery.", { spacing: { before: 120, after: 80 } }),
        new Paragraph({ spacing: { before: 80, after: 60 }, children: [
          new TextRun({ text: "Tech Stack:  ", bold: true, font: "Arial", size: 20 }),
          new TextRun({ text: "React 18 + Vite + Tailwind CSS v3  |  Zustand (state)  |  React Router v6  |  Express.js  |  better-sqlite3  |  Nodemailer", font: "Arial", size: 20, color: "444444" })
        ]}),
        new Paragraph({ spacing: { before: 60, after: 60 }, children: [
          new TextRun({ text: "Process Manager:  ", bold: true, font: "Arial", size: 20 }),
          new TextRun({ text: "PM2 on VPS 163.245.221.133 (API port 3001)", font: "Arial", size: 20, color: "444444" })
        ]}),
        new Paragraph({ spacing: { before: 60, after: 200 }, children: [
          new TextRun({ text: "Source Control:  ", bold: true, font: "Arial", size: 20 }),
          new TextRun({ text: "GitHub — engomatech/courierx-", font: "Arial", size: 20, color: "444444" })
        ]}),

        // ── SECTION 2: TEST ACCOUNTS ───────────────────
        h1("2. Test Accounts"),
        blueRule(),
        para("Use these credentials to test each role. All accounts are pre-seeded in the application — no setup required.", { spacing: { before: 120, after: 120 } }),
        testAccountsTable,
        new Paragraph({ spacing: { before: 200 }, children: [] }),

        // ── SECTION 3: SEED DATA ───────────────────────
        h1("3. Seed Data Reference"),
        blueRule(),
        h2("3.1  Shipments  (15 total — CX9001234567 through CX9001234581)"),
        para("The application launches with 15 pre-built shipments spanning every pipeline stage:", { spacing: { before: 80, after: 100 } }),
        shipmentsTable,
        new Paragraph({ spacing: { before: 160 }, children: [] }),
        h2("3.2  Operational Records"),
        opsRecordsTable,
        new Paragraph({ spacing: { before: 200 }, children: [] }),

        // ── SECTION 4: TEST CASES ──────────────────────
        h1("4. Module-by-Module Test Cases"),
        blueRule(),

        // 4.1
        h2("4.1  Authentication & RBAC"),
        ...tcPara("TC-AUTH-001  Admin login", ["Navigate to /login", "Enter admin@onlineexpress.com / admin123"], "Redirect to /admin/users"),
        ...tcPara("TC-AUTH-002  Operations login", ["Enter ops@onlineexpress.com / ops123"], "Redirect to /ops (Dashboard)"),
        ...tcPara("TC-AUTH-003  Customer login", ["Enter customer@example.com / cust123"], "Redirect to /portal"),
        ...tcPara("TC-AUTH-004  Driver login", ["Enter lisa@onlineexpress.com / driver123"], "Redirect to /driver — green header, Driver App"),
        ...tcPara("TC-AUTH-005  Role isolation", ["Login as driver, manually navigate to /ops"], "Access Denied page shown"),
        ...tcPara("TC-AUTH-006  Logout", ["Click logout/sign out button"], "Redirect to /login, session cleared"),
        ...tcPara("TC-AUTH-007  Customer registration", ["Navigate to /register, fill all fields"], "Verify email screen shown; use token link to activate account"),

        // 4.2
        h2("4.2  Booking Module  (/ops/booking)"),
        ...tcPara("TC-BOOK-001  Prohibited items modal", ["Click New Booking"], "Modal opens with 15 prohibited item icons and confirmation checkbox"),
        ...tcPara("TC-BOOK-002  Complete a booking", ["Check I confirm checkbox", "Click Agree", "Fill form (service, weight, dimensions, sender, receiver)", "Click Book Shipment"], "Success banner shown with generated AWB number (CX90xxxxxxxxx)"),
        ...tcPara("TC-BOOK-003  Print label from success banner", ["After booking, click Print Label in the green success banner"], "LabelModal opens with live preview showing Code 39 barcode, FROM/TO/weight blocks, service badge"),
        ...tcPara("TC-BOOK-004  Print label from table row", ["Click the printer icon Label button on any row in the bookings table"], "LabelModal opens pre-filled with that shipment's data"),
        ...tcPara("TC-BOOK-005  Browser print dialog", ["In LabelModal, click Print Label"], "New popup window opens with 4x6 label HTML; browser print dialog triggers automatically"),
        ...tcPara("TC-BOOK-006  Download ZPL", ["In LabelModal, click Download ZPL"], "File downloaded as {AWB}.zpl; file contains valid ZPL2 commands opening with ^XA and closing with ^XZ"),
        ...tcPara("TC-BOOK-007  Search", ["Type a partial AWB or sender name in the search box"], "Table filters in real time"),

        // 4.3
        h2("4.3  PRS — Pickup & Receive  (/ops/prs)"),
        ...tcPara("TC-PRS-001  View records", ["Navigate to /ops/prs"], "PRS-1001 through PRS-1004 listed with status and driver"),
        ...tcPara("TC-PRS-002  Create new PRS", ["Click New PRS", "Fill hub, route, driver", "Add AWBs CX9001234580 and CX9001234581", "Submit"], "New PRS created with status Proceed; shipments change to PRS Assigned"),
        ...tcPara("TC-PRS-003  Expand row", ["Click chevron on any PRS row"], "Shipment details table expands below"),

        // 4.4
        h2("4.4  Inbound Scan / Origin Scan  (/ops/inbound-scan)"),
        ...tcPara("TC-SCAN-001  Scan shipment", ["Enter CX9001234578 in scanner input, press Enter"], "Status changes to Origin Scanned; appears in scanned list"),
        ...tcPara("TC-SCAN-002  Duplicate scan", ["Scan CX9001234578 again"], "Warning shown — already scanned / duplicate prevented"),
        ...tcPara("TC-SCAN-003  Unknown AWB", ["Enter INVALID123 in scanner"], "Not found error shown"),

        // 4.5
        h2("4.5  Bag Management  (/ops/bags)"),
        ...tcPara("TC-BAG-001  View bags", ["Navigate to /ops/bags"], "BAG-1001, BAG-1002, BAG-1003 listed"),
        ...tcPara("TC-BAG-002  Create bag", ["Click New Bag", "Select destination, mode", "Add scanned AWBs", "Submit"], "Bag created with status Open; shipments change to Bagged"),
        ...tcPara("TC-BAG-003  Seal bag", ["Click Seal on an open bag"], "Bag status changes to Closed"),

        // 4.6
        h2("4.6  Manifest Management  (/ops/manifests)"),
        ...tcPara("TC-MAN-001  View manifests", ["Navigate to /ops/manifests"], "MAN-1001 (Arrived) and MAN-1002 (Dispatched) visible"),
        ...tcPara("TC-MAN-002  Create manifest", ["Click New Manifest", "Select origin hub, destination, transporter", "Add bags", "Submit"], "Manifest created; bag statuses update to Manifested"),
        ...tcPara("TC-MAN-003  Dispatch manifest", ["Click Dispatch on a pending manifest"], "Status changes to Dispatched; timestamp recorded"),
        ...tcPara("TC-MAN-004  Arrive manifest (discrepancy trigger)", ["Click Arrive on MAN-1002"], "Status changes to Arrived; any un-Hub-scanned shipments logged as missing_shipment discrepancies"),

        // 4.7
        h2("4.7  Hub Inbound  (/ops/hub-inbound)"),
        ...tcPara("TC-HUB-001  Scan manifested shipment", ["Enter CX9001234572 in scanner"], "Status changes to Hub Inbound; appears in scanned list"),
        ...tcPara("TC-HUB-002  Report exception from scanner", ["Click orange Report Exception button near scanner"], "ExceptionModal opens with blank AWB field"),
        ...tcPara("TC-HUB-003  Report exception from row", ["Click Exception button on a specific shipment row"], "ExceptionModal opens with that AWB pre-filled"),
        ...tcPara("TC-HUB-004  Submit damage exception", ["Set AWB, type = Damaged, severity = Minor, add description", "Click Submit"], "Exception recorded; Exceptions nav badge count increments; shipment status unchanged"),

        // 4.8
        h2("4.8  DRS — Delivery Route Sheet  (/ops/drs)"),
        ...tcPara("TC-DRS-001  View DRS runs", ["Navigate to /ops/drs"], "DRS-1001 (Completed — James Brown) and DRS-1002 (In Progress — Lisa Zhang) listed"),
        ...tcPara("TC-DRS-002  Start a pending DRS", ["Click Start Delivery on a Pending DRS"], "Status changes to In Progress; all shipments change to Out for Delivery"),
        ...tcPara("TC-DRS-003  Create new DRS", ["Click New DRS", "Select hub, route, driver, add AWBs", "Submit"], "New DRS created in Pending status"),
        ...tcPara("TC-DRS-004  Expand row", ["Click chevron on a DRS row"], "Shipment table shown with AWB, receiver, address, phone, status"),

        // 4.9
        h2("4.9  Delivery — POD & NDR  (/ops/delivery)"),
        ...tcPara("TC-DEL-001  View active shipments", ["Navigate to /ops/delivery"], "CX9001234570 and CX9001234571 (Out for Delivery) visible as cards"),
        ...tcPara("TC-DEL-002  Record POD", ["Click Mark Delivered on a shipment card", "Fill recipient name (required)", "Draw signature on canvas (required)", "Optionally capture a photo", "Click Confirm Delivery"], "Status changes to Delivered; POD saved to localStorage; silent POST to /api/v1/admin/pod/:awb"),
        ...tcPara("TC-DEL-003  Record NDR", ["Click Non-Delivery on a shipment card", "Select reason from dropdown", "Click Record NDR"], "Status changes to Non-Delivery; reason stored"),
        ...tcPara("TC-DEL-004  Report damage exception", ["Click orange Report Damage / Exception button"], "ExceptionModal opens with holdShipment=true; on submit, shipment changes to On Hold"),
        ...tcPara("TC-DEL-005  DRS auto-complete", ["Record POD or NDR for all shipments in a DRS run"], "DRS status automatically changes to Completed"),

        // 4.10
        h2("4.10  Discrepancies  (/ops/discrepancies)"),
        ...tcPara("TC-DISC-001  Nav badge", ["Navigate to any ops page"], "Red badge with count on Discrepancies nav item (when open discrepancies exist)"),
        ...tcPara("TC-DISC-002  Filter by status", ["Click Open / Resolved / All tabs"], "List filters accordingly"),
        ...tcPara("TC-DISC-003  Filter by type", ["Select Missing Shipment from type dropdown"], "Only missing_shipment records shown"),
        ...tcPara("TC-DISC-004  Resolve discrepancy", ["Click Resolve on an open discrepancy", "Select resolution reason, add notes, confirm"], "Status changes to Resolved; resolved timestamp shown on expand"),
        ...tcPara("TC-DISC-005  Auto-detection on arrival", ["Arrive a manifest (TC-MAN-004) with un-scanned shipments", "Navigate to /ops/discrepancies"], "New missing_shipment discrepancy created for each un-scanned AWB"),

        // 4.11
        h2("4.11  Exceptions  (/ops/exceptions)"),
        ...tcPara("TC-EXC-001  Nav badge", ["Navigate to any ops page"], "Orange badge with count on Exceptions nav item (open + under review)"),
        ...tcPara("TC-EXC-002  Stats cards", ["View /ops/exceptions page"], "Open, Under Review, Resolved, Total counts shown; each is clickable to filter"),
        ...tcPara("TC-EXC-003  Filter combinations", ["Use status tab, type dropdown, severity dropdown, keyword search in combination"], "List filters correctly for each combination"),
        ...tcPara("TC-EXC-004  Escalate exception", ["Click Escalate on an Open exception, confirm"], "Status changes to Under Review; escalatedAt timestamp shown; badge count updates"),
        ...tcPara("TC-EXC-005  Resolve exception", ["Click Resolve on Open or Under Review exception", "Select resolution, confirm"], "Status changes to Resolved; green resolution panel shown on expand"),
        ...tcPara("TC-EXC-006  Photos in expanded view", ["Expand an exception that has attached photos"], "Photos displayed in grid thumbnails"),

        // 4.12
        h2("4.12  Driver App  (/driver)"),
        ...tcPara("TC-DRV-001  Driver landing page", ["Login as lisa@onlineexpress.com / driver123"], "Green-header Driver App at /driver; DRS-1002 card visible with In Progress status"),
        ...tcPara("TC-DRV-002  Progress bar", ["View DRS-1002 card"], "Progress bar shows X of Y done with Delivered / NDR / Pending counts"),
        ...tcPara("TC-DRV-003  Open a run", ["Click Continue Run on DRS-1002"], "Navigate to /driver/run/DRS-1002; CX9001234570 and CX9001234571 shown as Out for Delivery"),
        ...tcPara("TC-DRV-004  Expand shipment card", ["Tap/click chevron on a shipment card"], "Address, tap-to-call phone link, AWB, weight, service type shown"),
        ...tcPara("TC-DRV-005  Record POD (driver)", ["Click Delivered on CX9001234570", "Fill recipient name", "Draw signature on touch canvas", "Optionally capture photo", "Click Confirm Delivery"], "Card status changes to Delivered; buttons disappear; progress bar updates; ops Delivery page reflects same status"),
        ...tcPara("TC-DRV-006  Record NDR (driver)", ["Click Failed on CX9001234571", "Select NDR reason from radio list", "Click Record NDR"], "Card status changes to Non-Delivery; DRS auto-completes to Completed (all stops done)"),
        ...tcPara("TC-DRV-007  Run complete", ["Record all stops on a DRS"], "Green celebration card shown: Run Complete!"),
        ...tcPara("TC-DRV-008  Role isolation", ["Login as driver, navigate to /ops"], "Access Denied page shown"),
        ...tcPara("TC-DRV-009  James Brown (DRS-1001)", ["Login as james@onlineexpress.com / driver123"], "DRS-1001 card shows Completed status with 100% progress bar"),

        // 4.13
        h2("4.13  Partner Orders  (/ops/partner-orders)"),
        ...tcPara("TC-PO-001  View partner shipments", ["Navigate to /ops/partner-orders"], "OEX-YYYY-NNNNN AWB shipments from SQLite listed"),
        ...tcPara("TC-PO-002  Shipment drawer", ["Click any partner order row"], "Side drawer opens with full shipment details and tracking timeline"),
        ...tcPara("TC-PO-003  POD evidence", ["Click a partner order with status Delivered"], "Emerald POD card shows recipient name, timestamp, signature image, delivery photo"),

        // 4.14
        h2("4.14  Reports  (/ops/reports)"),
        ...tcPara("TC-RPT-001  View reports", ["Navigate to /ops/reports"], "Summary stats, charts, and shipment data visible"),

        // 4.15
        h2("4.15  Admin — Notification Settings  (/admin/settings/notifications)"),
        ...tcPara("TC-NOT-001  Load notification settings", ["Login as admin", "Navigate to Admin > Settings > Notifications"], "5 toggle switches load from API without error; all default to Enabled"),
        ...tcPara("TC-NOT-002  Toggle off and persist", ["Disable Shipment Booked toggle", "Click Save", "Reload page"], "Toggle is still Off after reload"),
        ...tcPara("TC-NOT-003  Re-enable", ["Re-enable same toggle and Save"], "Toggle is On after reload"),

        // 4.16
        h2("4.16  Admin — SMTP Settings  (/admin/settings/smtp)"),
        ...tcPara("TC-SMTP-001  Load SMTP page", ["Navigate to Admin > Settings > SMTP Email"], "Form loads without error; fields empty by default"),
        ...tcPara("TC-SMTP-002  Save SMTP config", ["Fill host, port, encryption, user, password, from name, from email, ops notify email", "Click Save"], "Saved confirmation shown; settings persist on reload"),
        ...tcPara("TC-SMTP-003  Send test email", ["After configuring SMTP, enter recipient address in test field", "Click Send Test Email"], "Success message shown with message ID; test email received in inbox"),

        // 4.17
        h2("4.17  Admin — User Management  (/admin/users)"),
        ...tcPara("TC-USR-001  View all users", ["Navigate to /admin/users"], "All 5 seed users listed: Admin, Ops, Customer, Driver x2"),
        ...tcPara("TC-USR-002  Create user", ["Click Add User", "Fill name, email, password, select role", "Submit"], "New user appears in list and can login"),
        ...tcPara("TC-USR-003  Deactivate user", ["Set a user status to Inactive"], "That user cannot login — account deactivated error shown"),

        // 4.18
        h2("4.18  Customer Portal  (/portal)"),
        ...tcPara("TC-CUST-001  Customer dashboard", ["Login as customer@example.com / cust123"], "Portal with violet sidebar; dashboard shows summary"),
        ...tcPara("TC-CUST-002  Track shipment", ["Navigate to /track (public page)", "Enter any seed AWB"], "Tracking timeline shown"),
        ...tcPara("TC-CUST-003  Rate calculator", ["Use portal rate calculator with various weights and routes"], "Rates calculated without error"),

        // ── SECTION 5: E2E ─────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        h1("5. End-to-End Workflow Test"),
        blueRule(),
        para("This test verifies the complete shipment lifecycle from initial booking through proof of delivery. Complete all steps in sequence using the operations account.", { spacing: { before: 120, after: 120 } }),
        ...[
          "Login as ops@onlineexpress.com",
          "Booking: Create new shipment — note the generated AWB",
          "PRS: Create a new PRS, add the AWB, submit",
          "Inbound Scan: Scan the AWB — status changes to Origin Scanned",
          "Bag Management: Create a new bag, add the AWB, seal the bag",
          "Manifests: Create manifest with the bag, dispatch it",
          "Hub Inbound: Click Arrive on the manifest; scan the AWB at hub — status: Hub Inbound",
          "DRS: Create a DRS with the AWB, start the run — status: Out for Delivery",
          "Delivery: Record POD (sign + recipient name) — status: Delivered",
          "Booking page: Verify shipment shows Delivered status",
          "Label: Click Label button for the shipment — verify preview renders and ZPL downloads",
          "Logout ops — Login as admin — Admin > Settings > Notifications — verify 5 toggles load (no API error)",
        ].map((s, i) => new Paragraph({
          spacing: { before: 40, after: 40 },
          numbering: { reference: "numbers", level: 0 },
          children: [new TextRun({ text: s, font: "Arial", size: 20, color: "333333" })]
        })),
        new Paragraph({ spacing: { before: 160, after: 80 }, children: [
          new TextRun({ text: "Final Expected State: ", bold: true, font: "Arial", size: 20, color: "1A7A3C" }),
          new TextRun({ text: "Shipment status = Delivered — full operations pipeline completed successfully.", font: "Arial", size: 20, color: "1A7A3C" })
        ]}),

        // ── SECTION 6: KNOWN LIMITATIONS ───────────────
        new Paragraph({ children: [new PageBreak()] }),
        h1("6. Known Limitations & Notes"),
        blueRule(),

        h2("6.1  Data Persistence"),
        noteBox("Ops shipments (CX90xxx):", "Stored in browser localStorage via Zustand persist. Clearing localStorage resets all ops data to seed values. Use Reset to Demo Data in Admin > Settings > General to restore seed state."),
        noteBox("Partner API shipments (OEX-YYYY):", "Stored in SQLite on the VPS and persist across sessions and browsers."),
        noteBox("POD records:", "Saved to both localStorage (ops) and SQLite — the backend is the source of truth for partner-API POD display in the PartnerOrders drawer."),

        h2("6.2  Notifications / SMTP"),
        noteBox("Scope:", "Email notifications only fire for partner-API shipments (OEX-YYYY AWBs) — not for ops test shipments (CX90xxx)."),
        noteBox("Setup required:", "SMTP must be configured via Admin > Settings > SMTP Email before any emails are sent."),
        noteBox("API error warning:", "The API server not reachable message means the Express API on port 3001 is not running. Run pm2 restart all on the VPS."),

        h2("6.3  Barcode Scanning"),
        noteBox("Input method:", "The app uses a standard text input for scanning. Any USB or Bluetooth barcode scanner that emits text followed by Enter will work natively without any additional software."),

        h2("6.4  ZPL Labels"),
        noteBox("Printer spec:", "The .zpl file is configured for Zebra printers at 203 dpi on a 4x6 inch label. Adjust ^PW and font sizes in src/utils/zpl.js for different label dimensions."),
        noteBox("Browser print:", "The Print Label option sends to any printer (thermal or laser) via the browser print dialog."),

        h2("6.5  Driver App — Mobile"),
        noteBox("Screen size:", "The driver app (/driver) is optimised for mobile widths. Test on a physical device or using browser DevTools at 375px viewport width."),
        noteBox("Signature canvas:", "Touch-optimised with preventDefault to prevent page scroll during signing."),

        h2("6.6  Multi-tab / Multi-device Sync"),
        noteBox("Limitation:", "Zustand state is localStorage-only on the frontend. Changes in one browser tab are not reflected in another tab in real time. Refresh to synchronise."),

        // ── SECTION 7: DEPLOYMENT ──────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        h1("7. Deployment Reference"),
        blueRule(),

        h2("7.1  Standard Deployment (with frontend changes)"),
        codeBlock("cd /var/www/onlineexpress"),
        codeBlock("git pull"),
        codeBlock("npm run build"),
        codeBlock("pm2 restart all"),

        h2("7.2  Backend-only Changes"),
        para("If only api/ files were modified, skip the frontend build step:", { spacing: { before: 80, after: 60 } }),
        codeBlock("git pull && pm2 restart all"),

        h2("7.3  Check API Health"),
        codeBlock("curl http://163.245.221.133:3001/api/v1/health"),

        h2("7.4  Reset Seed Data (Ops Pipeline)"),
        para("Admin > Settings > General > Reset to Demo Data button.", { spacing: { before: 80, after: 160 } }),

        // ── SECTION 8: FEATURE SUMMARY ─────────────────
        new Paragraph({ children: [new PageBreak()] }),
        h1("8. Feature Summary"),
        blueRule(),
        para("All 21 features are implemented and deployed to production.", { spacing: { before: 120, after: 120 } }),
        featureSummaryTable,
        new Paragraph({ spacing: { before: 200 }, children: [] }),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:/Claude/shipping-app/OnlineExpress_Review_Testing_Guide.docx", buffer);
  console.log("SUCCESS: Document written to C:/Claude/shipping-app/OnlineExpress_Review_Testing_Guide.docx");
}).catch(err => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
