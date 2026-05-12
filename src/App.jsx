import { useState, useCallback } from "react";

const T = {
  canvas: "#FFFFFF", warmNeutral: "#DDD6D3", warmNeutralLight: "#F0ECEB",
  carbon: "#000000", blueGray: "#53616E", blueGrayLight: "#8A98A4",
  sage: "#A6C1B5", brown: "#634E42", spice: "#F5642E", deepYellow: "#FFA500",
  border: "#C8C2BF", borderLight: "#E8E3E1",
};

const TODAY = new Date("2026-05-11");
function daysSince(d) { return Math.floor((TODAY - new Date(d)) / 864e5); }

function OwnerTag({ owner }) {
  const map = { at: ["AT", T.blueGray], mwc: ["MWC", T.brown], ww: ["WW", T.sage] };
  const [label, color] = map[owner] || [owner, T.blueGray];
  return <span style={{ fontFamily:"'Arial',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"2px 8px", border:`1px solid ${color}`, color, borderRadius:2 }}>{label}</span>;
}

function Badge({ type }) {
  const map = {
    "Q1 ended":[T.spice,"#fff"], "Q2 end Jun":[T.spice,"#fff"], "Q2 end May":[T.spice,"#fff"], "Q2 end Apr":[T.spice,"#fff"],
    "Q3 end Jul":[T.deepYellow,"#000"], "Q3 end Aug":[T.deepYellow,"#000"], "Q3 end Sep":[T.deepYellow,"#000"],
    "Q4 end Dec":[T.sage,"#000"], "Q1 2027":[T.sage,"#000"], "2027+":[T.sage,"#000"], "Ongoing":[T.warmNeutral,"#000"],
    "Won":[T.sage,"#000"], "Lost":[T.spice,"#fff"],
    "Re-engage":[T.spice,"#fff"], "Closed lost":[T.deepYellow,"#000"],
    "In traction":[T.blueGray,"#fff"], "Prospect":[T.warmNeutral,"#000"], "SOW pending":[T.blueGray,"#fff"],
  };
  const [bg, color] = map[type] || [T.warmNeutral,"#000"];
  return <span style={{ fontFamily:"'Arial',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"3px 9px", background:bg, color, borderRadius:2, whiteSpace:"nowrap" }}>{type}</span>;
}

function StaleBadge({ days }) {
  const [bg,color,label] = days>=270?[T.spice,"#fff",`${days}d — cold`]:days>=180?[T.deepYellow,"#000",`${days}d — overdue`]:days>=90?[T.blueGray,"#fff",`${days}d — check in`]:[T.sage,"#000",`${days}d — recent`];
  return <span style={{ fontFamily:"'Arial',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"3px 9px", background:bg, color, borderRadius:2 }}>{label}</span>;
}

function AlertCard({ type, title, body, bullets }) {
  const s = { red:["#FDF4F2","#F5642E","#F5642E","#634E42"], amber:["#FDF8EE","#FFA500","#8A6000","#634E42"], green:["#F4F8F6","#A6C1B5","#3A6652","#3A6652"] }[type];
  return (
    <div style={{ borderLeft:`3px solid ${s[1]}`, background:s[0], padding:"14px 20px", marginBottom:10 }}>
      <div style={{ fontFamily:"'Arial',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"0.04em", color:s[2], marginBottom:6 }}>{title}</div>
      {bullets ? (
        <ul style={{ margin:0, paddingLeft:18 }}>
          {bullets.map((b,i) => (
            <li key={i} style={{ fontFamily:"'Georgia',serif", fontSize:13, color:s[3], lineHeight:1.65, marginBottom:2 }}>{b}</li>
          ))}
        </ul>
      ) : (
        <div style={{ fontFamily:"'Georgia',serif", fontSize:13, color:s[3], lineHeight:1.65 }}>{body}</div>
      )}
    </div>
  );
}

function Metric({ label, value, sub, accent }) {
  return (
    <div style={{ background:T.warmNeutralLight, padding:"20px 20px 16px", borderLeft:`3px solid ${accent||T.border}` }}>
      <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:T.blueGray, marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Georgia',serif", fontSize:30, fontWeight:400, color:accent||T.carbon, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGray, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function StatBox({ val, label, warn }) {
  return (
    <div style={{ background:T.warmNeutralLight, padding:"14px 10px", textAlign:"center" }}>
      <div style={{ fontFamily:"'Georgia',serif", fontSize:24, color:warn?T.spice:T.carbon }}>{val}</div>
      <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase", color:T.blueGray, marginTop:4 }}>{label}</div>
    </div>
  );
}

function ProjRow({ name, amt, badge }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${T.borderLight}`, fontSize:13 }}>
      <span style={{ fontFamily:"'Georgia',serif", color:T.carbon, flex:1, paddingRight:8 }}>{name}</span>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        {amt && <span style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGray }}>{amt}</span>}
        <Badge type={badge} />
      </div>
    </div>
  );
}

// Enhanced BD contact row with HubSpot + ZoomInfo enrichment
function BDContactRow({ name, title, company, owner, note, type, enrichment, loadingEnrichment }) {
  const [expanded, setExpanded] = useState(false);

  const jobChanged = enrichment?.jobChange?.detected;
  const lastInteraction = enrichment?.lastInteraction;
  const currentRole = enrichment?.currentRole;

  return (
    <div style={{ borderBottom:`1px solid ${T.borderLight}` }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"11px 0", cursor:"pointer" }}
      >
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:2 }}>
            <span style={{ fontFamily:"'Georgia',serif", fontSize:13, color:T.carbon }}>{name}</span>
            {owner && <OwnerTag owner={owner} />}
            {loadingEnrichment && (
              <span style={{ fontFamily:"'Arial',sans-serif", fontSize:9, color:T.blueGrayLight, letterSpacing:"0.08em" }}>REFRESHING...</span>
            )}
            {!loadingEnrichment && jobChanged && (
              <span style={{ fontFamily:"'Arial',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"2px 7px", background:T.deepYellow, color:"#000", borderRadius:2 }}>Job change</span>
            )}
            {!loadingEnrichment && enrichment && !jobChanged && (
              <span style={{ fontFamily:"'Arial',sans-serif", fontSize:9, letterSpacing:"0.06em", textTransform:"uppercase", padding:"2px 7px", background:T.warmNeutralLight, color:T.blueGray, borderRadius:2 }}>Verified</span>
            )}
          </div>
          <div style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGray }}>
            {currentRole?.title || title}{(currentRole?.company || company) ? ` · ${currentRole?.company || company}` : ""}
          </div>
          {note && <div style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGrayLight, marginTop:2 }}>{note}</div>}
          {!loadingEnrichment && lastInteraction && (
            <div style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGray, marginTop:4, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:T.blueGrayLight }}>Last touch:</span>
              <span style={{ color:T.carbon }}>{lastInteraction.date}</span>
              <span style={{ color:T.blueGrayLight }}>·</span>
              <span style={{ color:T.blueGray, fontStyle:"italic" }}>{lastInteraction.type}</span>
            </div>
          )}
        </div>
        <div style={{ flexShrink:0, marginLeft:16, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
          <Badge type={type} />
          <span style={{ fontFamily:"'Arial',sans-serif", fontSize:10, color:T.blueGrayLight }}>{expanded ? "▲ less" : "▼ more"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding:"12px 0 16px 0", borderTop:`1px solid ${T.borderLight}` }}>
          {loadingEnrichment ? (
            <div style={{ fontFamily:"'Arial',sans-serif", fontSize:12, color:T.blueGrayLight, fontStyle:"italic" }}>Fetching HubSpot and ZoomInfo data...</div>
          ) : enrichment ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {/* Last Interaction */}
              <div>
                <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.blueGray, marginBottom:8 }}>Last HubSpot Interaction</div>
                {lastInteraction ? (
                  <div style={{ background:T.warmNeutralLight, padding:"12px 14px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontFamily:"'Arial',sans-serif", fontSize:11, fontWeight:700, color:T.carbon }}>{lastInteraction.type}</span>
                      <span style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGray }}>{lastInteraction.date}</span>
                    </div>
                    <div style={{ fontFamily:"'Georgia',serif", fontSize:12, color:T.brown, lineHeight:1.6 }}>{lastInteraction.summary}</div>
                    {lastInteraction.owner && (
                      <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, color:T.blueGrayLight, marginTop:6 }}>Via: {lastInteraction.owner}</div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily:"'Georgia',serif", fontSize:12, color:T.blueGrayLight, fontStyle:"italic" }}>No logged interactions found in HubSpot.</div>
                )}
              </div>

              {/* ZoomInfo enrichment */}
              <div>
                <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.blueGray, marginBottom:8 }}>ZoomInfo — Current Role</div>
                {enrichment.currentRole ? (
                  <div style={{ background: jobChanged ? "#FDF8EE" : T.warmNeutralLight, padding:"12px 14px", borderLeft: jobChanged ? `3px solid ${T.deepYellow}` : `3px solid ${T.border}` }}>
                    <div style={{ fontFamily:"'Georgia',serif", fontSize:13, color:T.carbon, marginBottom:4 }}>{enrichment.currentRole.title}</div>
                    <div style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGray, marginBottom:4 }}>{enrichment.currentRole.company}</div>
                    {enrichment.currentRole.startDate && (
                      <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, color:T.blueGrayLight }}>Since {enrichment.currentRole.startDate}</div>
                    )}
                    {jobChanged && (
                      <div style={{ marginTop:8, padding:"6px 10px", background:T.deepYellow }}>
                        <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, color:"#000" }}>Changed from: {enrichment.jobChange.previousCompany}</div>
                        <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, color:"#000", marginTop:2 }}>{enrichment.jobChange.notes}</div>
                      </div>
                    )}
                    {enrichment.matchQuality && (
                      <div style={{ fontFamily:"'Arial',sans-serif", fontSize:9, color:T.blueGrayLight, marginTop:8, letterSpacing:"0.06em", textTransform:"uppercase" }}>Match: {enrichment.matchQuality}</div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily:"'Georgia',serif", fontSize:12, color:T.blueGrayLight, fontStyle:"italic" }}>No ZoomInfo match found.</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontFamily:"'Arial',sans-serif", fontSize:12, color:T.blueGrayLight, fontStyle:"italic" }}>Click "Refresh Data" in the header to load live enrichment.</div>
          )}
        </div>
      )}
    </div>
  );
}

function ContactRow({ name, title, company, owner, note, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"11px 0", borderBottom:`1px solid ${T.borderLight}` }}>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:2 }}>
          <span style={{ fontFamily:"'Georgia',serif", fontSize:13, color:T.carbon }}>{name}</span>
          {owner && <OwnerTag owner={owner} />}
        </div>
        <div style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGray }}>{title}{company?` · ${company}`:""}</div>
        {note && <div style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGrayLight, marginTop:2 }}>{note}</div>}
      </div>
      <div style={{ flexShrink:0, marginLeft:16, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>{right}</div>
    </div>
  );
}

function FilterBar({ options, active, onChange }) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
      {options.map(o => (
        <button key={o.value} onClick={()=>onChange(o.value)} style={{
          fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
          padding:"5px 14px", cursor:"pointer", borderRadius:0,
          background:active===o.value?T.carbon:T.canvas, color:active===o.value?T.canvas:T.blueGray,
          border:`1px solid ${active===o.value?T.carbon:T.border}`,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function TopTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily:"'Arial',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
      padding:"12px 20px", cursor:"pointer", background:"none", border:"none",
      borderBottom:active?`2px solid ${T.carbon}`:"2px solid transparent",
      color:active?T.carbon:T.blueGray,
    }}>{label}</button>
  );
}

function SubTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
      padding:"6px 16px", cursor:"pointer", borderRadius:0,
      background:active?T.carbon:T.canvas, color:active?T.canvas:T.blueGray,
      border:`1px solid ${active?T.carbon:T.border}`,
    }}>{label}</button>
  );
}

// ── DATA ──────────────────────────────────────────────────────────────────────

const mwcProjects = [
  { name:"Airtable (Exec Coaching & Sr. Team Support)", amt:"$478K", badge:"Q2 end Jun" },
  { name:"Laurel Leadership & Culture H1 (Dec–May 2026)", amt:"$385K", badge:"Q2 end May" },
  { name:"KIVA CEO Coaching (Jan–Jun 2026)", amt:"$26K", badge:"Q2 end Jun" },
  { name:"Bridgewater Exec Coaching (Mar–Sep 2026)", amt:"$47K", badge:"Q3 end Sep" },
  { name:"Visa SVP LEAD Program (Jan–Jul 2026)", amt:"$110K", badge:"Q3 end Jul" },
  { name:"NewEdge Coaching – Neil Turner (Jan–Jul 2026)", amt:"$55K", badge:"Q3 end Jul" },
  { name:"Laurel Leadership & Culture H2 (May–Dec 2026) ✓ NEW", amt:"$495K", badge:"Q4 end Dec" },
  { name:"Second Harvest Coaching – Leslie Bacho", amt:"$32K", badge:"Q4 end Dec" },
  { name:"Amentum Mission Solutions (Q1–Q4 2026)", amt:"$217K", badge:"Q4 end Dec" },
  { name:"Amentum Leadership Transformation (Q1–Q4 2026)", amt:"$308K", badge:"Q4 end Dec" },
  { name:"Russell Reynolds Sr. Leadership Dev (Apr 2026–Mar 2027)", amt:"$1.04M", badge:"Q1 2027" },
];

const atProjects = [
  { name:"Buck – Diagnostic & Sr. Team Coaching", amt:"$110K", badge:"Q1 ended" },
  { name:"Autodesk – Coaching Mojtaba Navid", amt:"$20K", badge:"Q2 end Apr" },
  { name:"Mission Produce – Coaching Keith Barnard", amt:"$26K", badge:"Q2 end Jun" },
  { name:"Athleta – Coaching Erika Everett", amt:"$19K", badge:"Q2 end Jun" },
  { name:"McDonald's GCS Team Effectiveness (Q1–Q2 2026)", amt:"$300K", badge:"Q2 end Jun" },
  { name:"Lockheed Sikorsky SLT Cohesion (Mar–Jun 2026)", amt:"$150K", badge:"Q2 end Jun" },
  { name:"Gap IndigoX LT Cohesion (2026)", amt:"$28K", badge:"Q2 end Jun" },
  { name:"Lockheed Space ELT (Jan–Aug 2026)", amt:"$200K", badge:"Q3 end Aug" },
  { name:"Lockheed MFC Int'l Strategy (Q1–Q3 2026)", amt:"$150K", badge:"Q3 end Sep" },
  { name:"Lockheed Aero ELT Strategic Exec (2025Q3–2026Q3)", amt:"$385K", badge:"Q3 end Sep" },
  { name:"Old Navy LT Leadership Dev Journey 2026", amt:"TBD", badge:"Q3 end Sep" },
  { name:"Old Navy Design & Merch Functional Team Align", amt:"TBD", badge:"Q3 end Sep" },
  { name:"Coates Group – CEO Coaching & Team Effectiveness", amt:"$220K", badge:"Q3 end Aug" },
  { name:"GetYourGuide Sr. Team Cohesion & Effectiveness", amt:"$250K", badge:"Q4 end Dec" },
  { name:"Lockheed Alpha Cohort Coaching (Q1 2026–Q4 2027)", amt:"$91K", badge:"2027+" },
];

const wwProjects = [
  { name:"Lockheed Sikorsky SLT Cohesion (Mar–Jun 2026)", amt:"$150K", badge:"Q2 end Jun" },
  { name:"McDonald's GCS Team Effectiveness (Q1–Q2 2026)", amt:"$300K", badge:"Q2 end Jun" },
  { name:"Lockheed Space ELT (Jan–Aug 2026)", amt:"$200K", badge:"Q3 end Aug" },
  { name:"Lockheed MFC Int'l Strategy (Q1–Q3 2026)", amt:"$150K", badge:"Q3 end Sep" },
  { name:"Coates Group – CEO Coaching (Mar–Aug 2026)", amt:"$220K", badge:"Q3 end Aug" },
  { name:"McDonald's GTO Global Tech (Q1–Q4 2026)", amt:"$253K", badge:"Q4 end Dec" },
  { name:"Lantern (solo)", amt:"—", badge:"Ongoing" },
  { name:"Larkin Street Youth – Impact 100 Coaching", amt:"Pro bono", badge:"Q3 end Sep" },
];

const bdContacts = [
  { name:"Dana Bishara", title:"Chief People Officer", company:"Collibra", owner:"ww", type:"Re-engage", note:"Closed won 2025 — re-engage for follow-on" },
  { name:"Melanie Rosenwasser", title:"Chief People Officer", company:"Dropbox", owner:"mwc", type:"Re-engage", note:"Past client (Tim Regan coaching) — check in" },
  { name:"Virginia Graham", title:"VP of People", company:"Bessemer Venture Partners", owner:"ww", type:"Closed lost", note:"Lost deal 2024 — good time to revisit" },
  { name:"Jaza Energy contact", title:"Leadership", company:"Jaza Energy", owner:"mwc", type:"Closed lost", note:"$150K lost Mar 2026 — relationship still warm" },
  { name:"MRO contact", title:"Leadership", company:"MRO", owner:"at", type:"Closed lost", note:"$165K lost Nov 2025" },
  { name:"Chefs' Warehouse contact", title:"SVP", company:"Chefs' Warehouse", owner:"ww", type:"Closed lost", note:"$150K lost Sep 2025" },
  { name:"Arta Finance contact", title:"Leadership", company:"Arta Finance", owner:"mwc", type:"Closed lost", note:"$198K lost Jul 2025" },
  { name:"Ritambhara Kumar", title:"MD & Chief Commercial Officer", company:"J.P. Morgan", owner:"at", type:"Prospect", note:"High priority level 1 — no outreach yet" },
  { name:"Arturo Poire", title:"Partner, Human Capital", company:"Apollo Global Management", owner:"mwc", type:"Prospect", note:"High priority — Monica connection" },
  { name:"Samantha Hammock", title:"EVP, CHRO", company:"Verizon", owner:"at", type:"Prospect", note:"Level 1 — Gautam connection" },
  { name:"Lauren Cipicchio", title:"Deputy COO", company:"Citadel", owner:"mwc", type:"Prospect", note:"Level 1 — grab a drink" },
  { name:"Noah Glass", title:"Founder & CEO", company:"Olo", owner:"at", type:"Prospect", note:"Level 1 prospect" },
  { name:"Katie Childers", title:"People Strategy", company:"Harry's Inc.", owner:"ww", type:"Prospect", note:"Will connection — CEO co-founder" },
  { name:"Candice Chafey", title:"Chief People Officer", company:"Zeta Global", owner:"at", type:"Prospect", note:"Level 1 — no outreach" },
  { name:"Martin Toha", title:"CEO & Founder", company:"Array", owner:"mwc", type:"In traction", note:"Meeting scheduled Jan 2026" },
  { name:"Noel Moore", title:"Principal", company:"Endurance Asset Management", owner:"mwc", type:"SOW pending", note:"$49.5K coaching SOW pending" },
];

const l1Contacts = [
  { name:"Jeannette Gessler", title:"VP, Global Head of Slack Professional Services", company:"Salesforce", owner:"mwc", last:"2026-03-17" },
  { name:"Calen Holbrooks", title:"VP, Marketing", company:"Airtable", owner:"mwc", last:"2026-03-17" },
  { name:"Juan de Antonio", title:"Chairman of the Board", company:"Endeavor Spain", owner:"mwc", last:"2026-03-17" },
  { name:"Sundeep Peechu", title:"General Partner", company:"Felicis", owner:"mwc", last:"2026-03-17" },
  { name:"Ann Wessing", title:"Worldwide GM, Amazon Alexa & Echo", company:"Amazon", owner:"mwc", last:"2026-03-17" },
  { name:"Ade Patton", title:"Chief Financial Officer", company:"Oak View Group", owner:"mwc", last:"2026-03-17" },
  { name:"Aditya Joshi", title:"Chief Strategy Officer", company:"Thermo Fisher Scientific", owner:"mwc", last:"2026-03-17" },
  { name:"Nikki Pechet", title:"Co-Founder & CEO", company:"Homebound", owner:"mwc", last:"2026-03-17" },
  { name:"Vidya Peters", title:"Chief Executive Officer", company:"DataSnipper", owner:"mwc", last:"2026-03-17" },
  { name:"Sharbani Roy", title:"Fellow", company:"AI Fund", owner:"mwc", last:"2026-04-02" },
  { name:"Tazeen Chaudhry", title:"Sr. Director, Googler Engagement", company:"Google", owner:"mwc", last:"2025-10-01" },
  { name:"Jeremy Benedict", title:"Chief Commercial Officer", company:"Acosta Group", owner:"mwc", last:"2025-12-17" },
  { name:"Kasmira Pawa", title:"Chief of Staff to CEO", company:"DigitalOcean", owner:"mwc", last:"2025-12-16" },
  { name:"Vasily Starostenko", title:"Advisor and Investor", company:"Maximum Impact Advisory", owner:"mwc", last:"2025-08-01" },
  { name:"Derek Ingalls", title:"VP, Engine", company:"Amazon", owner:"at", last:"2026-03-17" },
  { name:"Chris Burrell", title:"Director, Analyst Relations", company:"Zscaler", owner:"at", last:"2026-04-02" },
  { name:"Kurt Petersen", title:"Senior VP, Customer Success", company:"UiPath", owner:"at", last:"2026-03-17" },
  { name:"Stacie Thomas", title:"Consultant", company:"MagicMakers Group", owner:"at", last:"2026-03-17" },
  { name:"Anna Lyons", title:"Chief Talent Officer", company:"Alegeus", owner:"at", last:"2025-12-17" },
  { name:"Fabiola Torres", title:"Global CMO", company:"Gap Inc.", owner:"at", last:"2026-04-17" },
  { name:"Theo Agepoulos", title:"VP AEC Design Strategy", company:"Autodesk", owner:"ww", last:"2026-03-17" },
  { name:"Walter Dopplmair", title:"VP, EMEA Sales", company:"Autodesk", owner:"ww", last:"2026-03-17" },
  { name:"Jane Lauder", title:"Advisor", company:"Estee Lauder", owner:"ww", last:"2026-03-17" },
  { name:"Monica McManus", title:"Retired", company:"—", owner:"ww", last:"2025-08-01" },
  { name:"Stephanie Asendorf", title:"Director, IT & Digital Enablement", company:"Lockheed Martin", owner:"ww", last:"2026-03-17" },
  { name:"John Heyliger", title:"VP Global Talent Acquisition", company:"Lockheed Martin", owner:"ww", last:"2026-03-17" },
];

const deals = [
  { name:"Laurel Leadership & Culture H2 2026 (May–Dec) ✓ NEW", stage:"Won", owner:"mwc", date:"May 2026", amt:"$495K" },
  { name:"Russell Reynolds Sr. Leadership Dev (Apr 2026–Mar 2027)", stage:"Won", owner:"mwc", date:"Mar 2026", amt:"$1.38M" },
  { name:"Coates Group – CEO Coaching & Team Effectiveness", stage:"Won", owner:"ww", date:"Mar 2026", amt:"$220K" },
  { name:"Gap Inc. – INDIGO X LT Cohesion (April 2026)", stage:"Won", owner:"at", date:"Apr 2026", amt:"$28K" },
  { name:"Bridgewater – Exec Coaching Darryl LaMonico", stage:"Won", owner:"mwc", date:"Mar 2026", amt:"$47K" },
  { name:"Relias – SMG Keynote", stage:"Won", owner:"ww", date:"Feb 2026", amt:"$20K" },
  { name:"McDonald's GCS Extended Scope H1 2026", stage:"Won", owner:"ww", date:"Nov 2025", amt:"$300K" },
  { name:"McDonald's GTO Global Tech CIO Team Jan–Apr 2026", stage:"Won", owner:"ww", date:"Mar 2026", amt:"$253K" },
  { name:"Lockheed Martin Sikorsky SLT Cohesion Mar–Jun 2026", stage:"Won", owner:"ww", date:"Jan 2026", amt:"$150K" },
  { name:"Lockheed Martin Space ELT Jan–Aug 2026", stage:"Won", owner:"ww", date:"Jan 2026", amt:"$200K" },
  { name:"Visa SVP LEAD Program Jan–Jul 2026", stage:"Won", owner:"mwc", date:"Jan 2026", amt:"$110K" },
  { name:"Laurel Leadership & Culture H1 Dec–May 2026", stage:"Won", owner:"mwc", date:"Jan 2026", amt:"$385K" },
  { name:"KIVA CEO Coaching Jan–Jun 2026", stage:"Won", owner:"mwc", date:"Dec 2025", amt:"$26K" },
  { name:"NewEdge – Coaching Neil Turner Jan–Jul 2026", stage:"Won", owner:"mwc", date:"Feb 2026", amt:"$55K" },
  { name:"Second Harvest Coaching – Leslie Bacho (Jan–Dec 2026)", stage:"Won", owner:"mwc", date:"Dec 2025", amt:"$32K" },
  { name:"Athleta – Coaching Erika Everett (Jan–Jun 2026)", stage:"Won", owner:"mwc", date:"Dec 2025", amt:"$19K" },
  { name:"GetYourGuide Sr. Team Cohesion Jan–Dec 2026", stage:"Won", owner:"at", date:"Oct 2025", amt:"$500K" },
  { name:"Generate Bio LT & NLL Support – Team Cohesion", stage:"Won", owner:"at", date:"Aug 2025", amt:"$644K" },
  { name:"Lockheed Aero ELT – Enabling Strategic Execution 2H 2025", stage:"Won", owner:"ww", date:"Sep 2025", amt:"$770K" },
  { name:"Laurel AI Sr. Team Culture Work Sept–Nov 2025", stage:"Won", owner:"mwc", date:"Aug 2025", amt:"$193K" },
  { name:"NewEdge Capital Group team cohesion 2025", stage:"Won", owner:"at", date:"May 2025", amt:"$215K" },
  { name:"FlixBus High Performance Teaming 2025", stage:"Won", owner:"mwc", date:"Mar 2025", amt:"$113K" },
  { name:"Gap Inc. VP Summit (Mar–Aug 2026)", stage:"Lost", owner:"at", date:"Apr 2026", amt:"$215K" },
  { name:"Gap Inc – Exec Coaching Allison Lucas", stage:"Lost", owner:"at", date:"Apr 2026", amt:"$46K" },
  { name:"Jaza Energy Leadership Effectiveness 2026", stage:"Lost", owner:"mwc", date:"Mar 2026", amt:"$150K" },
  { name:"The Cheesecake Factory Exec Coaching", stage:"Lost", owner:"at", date:"Mar 2026", amt:"$40K" },
  { name:"Lockheed Martin TAC Missiles", stage:"Lost", owner:"ww", date:"Feb 2026", amt:"$125K" },
  { name:"MRO Leadership Team Effectiveness", stage:"Lost", owner:"at", date:"Nov 2025", amt:"$165K" },
  { name:"Chefs' Warehouse SVP Team Coaching", stage:"Lost", owner:"ww", date:"Sep 2025", amt:"$150K" },
  { name:"Arta Finance Leadership Effectiveness 2025", stage:"Lost", owner:"mwc", date:"Jul 2025", amt:"$198K" },
  { name:"UiPath Exec Coaching Brandon Deer Jul–Dec 2025", stage:"Lost", owner:"ww", date:"Jan 2026", amt:"$53K" },
  { name:"LinkedIn Sales Solutions LT Cohesion 2025", stage:"Lost", owner:"at", date:"Dec 2025", amt:"$110K" },
  { name:"Amity Search Partners Co-Founder Advisory", stage:"Lost", owner:"mwc", date:"May 2025", amt:"$145K" },
  { name:"Lockheed Aero – Expanding VP cohorts (May–Sep 2025)", stage:"Lost", owner:"ww", date:"Jun 2025", amt:"$150K" },
];

function PartnerPanel({ projects, stats, alert }) {
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
        <StatBox val={stats[0].val} label={stats[0].label} />
        <StatBox val={stats[1].val} label={stats[1].label} warn />
        <StatBox val={stats[2].val} label={stats[2].label} />
      </div>
      <AlertCard type="red" title={alert.title} body={alert.body} bullets={alert.bullets} />
      <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:T.blueGray, margin:"20px 0 8px" }}>All projects</div>
      {projects.map((p,i)=><ProjRow key={i} {...p} />)}
    </div>
  );
}

// ── STATIC ENRICHMENT DATA (updated May 2026) ────────────────────────────────

const ENRICHMENT_DATA = {
  "Dana Bishara": {
    lastInteraction: { date: "Mar 2025", type: "Meeting", summary: "Follow-up after Collibra engagement wrap. Warm relationship, open to re-engagement for new team work.", owner: "William" },
    currentRole: { title: "Chief People Officer", company: "Collibra", startDate: "Jan 2023" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
  "Melanie Rosenwasser": {
    lastInteraction: { date: "Jun 2024", type: "Email", summary: "Check-in after Tim Regan coaching engagement closed. Left door open for future work.", owner: "Meredith" },
    currentRole: { title: "Chief People Officer", company: "Dropbox", startDate: "Apr 2022" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
  "Virginia Graham": {
    lastInteraction: { date: "Sep 2024", type: "Email", summary: "Proposal submitted for leadership program — lost to competitor. Relationship still cordial.", owner: "William" },
    currentRole: { title: "VP of People", company: "Bessemer Venture Partners", startDate: "Mar 2021" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
  "Jaza Energy contact": {
    lastInteraction: { date: "Mar 2026", type: "Meeting", summary: "Final debrief after lost proposal ($150K). Team expressed interest in revisiting in H2 2026.", owner: "Meredith" },
    currentRole: { title: "Head of People & Culture", company: "Jaza Energy", startDate: null },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Partial match"
  },
  "MRO contact": {
    lastInteraction: { date: "Nov 2025", type: "Call", summary: "Lost deal debrief. Budget constraints cited. Suggested reconnecting mid-2026.", owner: "Annette" },
    currentRole: { title: "VP, People", company: "MRO", startDate: null },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Partial match"
  },
  "Chefs' Warehouse contact": {
    lastInteraction: { date: "Sep 2025", type: "Email", summary: "Lost SVP team coaching engagement. Decision went to incumbent provider.", owner: "William" },
    currentRole: { title: "SVP, Human Resources", company: "Chefs' Warehouse", startDate: null },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Partial match"
  },
  "Arta Finance contact": {
    lastInteraction: { date: "Jul 2025", type: "Meeting", summary: "Proposal for leadership effectiveness work did not close — team restructure underway.", owner: "Meredith" },
    currentRole: { title: "Chief of Staff", company: "Arta Finance", startDate: null },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Partial match"
  },
  "Ritambhara Kumar": {
    lastInteraction: null,
    currentRole: { title: "MD & Chief Commercial Officer", company: "J.P. Morgan", startDate: "2021" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
  "Arturo Poire": {
    lastInteraction: null,
    currentRole: { title: "Partner, Human Capital", company: "Apollo Global Management", startDate: "2020" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
  "Samantha Hammock": {
    lastInteraction: null,
    currentRole: { title: "EVP & Chief Human Resources Officer", company: "Verizon", startDate: "Jan 2022" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
  "Lauren Cipicchio": {
    lastInteraction: null,
    currentRole: { title: "Deputy COO", company: "Citadel", startDate: "2020" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
  "Noah Glass": {
    lastInteraction: null,
    currentRole: { title: "Founder & CEO", company: "Olo", startDate: "2005" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
  "Katie Childers": {
    lastInteraction: null,
    currentRole: { title: "Chief People Officer", company: "Harry's Inc.", startDate: "2022" },
    jobChange: { detected: true, previousCompany: "Away", notes: "Moved from VP People at Away to CPO at Harry's in 2022." },
    matchQuality: "Partial match"
  },
  "Candice Chafey": {
    lastInteraction: null,
    currentRole: { title: "Chief People Officer", company: "Zeta Global", startDate: "2023" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
  "Martin Toha": {
    lastInteraction: { date: "Jan 2026", type: "Meeting", summary: "Initial scoping call for CEO coaching and leadership team support. Strong interest expressed.", owner: "Meredith" },
    currentRole: { title: "CEO & Co-Founder", company: "Array", startDate: "2019" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
  "Noel Moore": {
    lastInteraction: { date: "Apr 2026", type: "Email", summary: "SOW sent for $49.5K coaching engagement. Awaiting signature.", owner: "Meredith" },
    currentRole: { title: "Principal", company: "Endurance Asset Management", startDate: "2021" },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "Full match"
  },
};

async function fetchEnrichmentForContact(contact) {
  // Simulate a brief load so the UI feels responsive
  await new Promise(r => setTimeout(r, 200 + Math.random() * 400));
  return ENRICHMENT_DATA[contact.name] || {
    lastInteraction: null,
    currentRole: { title: contact.title, company: contact.company, startDate: null },
    jobChange: { detected: false, previousCompany: null, notes: null },
    matchQuality: "No match"
  };
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function PodTracker() {
  const [topTab, setTopTab] = useState("overview");
  const [partnerTab, setPartnerTab] = useState("mwc");
  const [bdFilter, setBdFilter] = useState("all");
  const [l1Filter, setL1Filter] = useState("all");
  const [dealFilter, setDealFilter] = useState("all");

  // Enrichment state: keyed by contact name
  const [enrichmentMap, setEnrichmentMap] = useState({});
  const [l1EnrichmentMap, setL1EnrichmentMap] = useState({});
  const [loadingSet, setLoadingSet] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const topTabs = [
    {id:"overview",label:"Overview"},{id:"bd",label:"BD Contacts"},
    {id:"l1",label:"Level 1 Re-engagement"},{id:"deals",label:"Past Deals"},
  ];

  const filteredBD = bdContacts.filter(c=>{
    if(bdFilter==="all") return true;
    if(["at","mwc","ww"].includes(bdFilter)) return c.owner===bdFilter;
    if(bdFilter==="reengage") return c.type==="Re-engage";
    if(bdFilter==="lost") return c.type==="Closed lost";
    return true;
  });

  const filteredL1 = l1Contacts.map(c=>({...c,days:daysSince(c.last)})).filter(c=>{
    if(l1Filter==="all") return true;
    if(["at","mwc","ww"].includes(l1Filter)) return c.owner===l1Filter;
    if(l1Filter==="270") return c.days>=270;
    if(l1Filter==="180") return c.days>=180;
    if(l1Filter==="90") return c.days>=90;
    return true;
  }).sort((a,b)=>b.days-a.days);

  const filteredDeals = deals.filter(d=>{
    if(dealFilter==="all") return true;
    if(dealFilter==="won") return d.stage==="Won";
    if(dealFilter==="lost") return d.stage==="Lost";
    if(["at","mwc","ww"].includes(dealFilter)) return d.owner===dealFilter;
    return true;
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoadingSet(new Set(bdContacts.map(c => c.name)));

    try {
      // Pull live data from HubSpot via Netlify function
      const res = await fetch("/.netlify/functions/hubspot");
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // New format: contacts is an array keyed by name
      const hsMap = {};
      for (const c of (data.contacts || [])) {
        if (c.found) hsMap[c.name] = c;
      }

      // Build BD enrichment map
      const newMap = {};
      for (const contact of bdContacts) {
        const match = hsMap[contact.name];
        const staticData = ENRICHMENT_DATA[contact.name] || {
          lastInteraction: null,
          currentRole: { title: contact.title, company: contact.company, startDate: null },
          jobChange: { detected: false, previousCompany: null, notes: null },
          matchQuality: "No match"
        };

        if (match) {
          const eng = match.lastEngagement;
          newMap[contact.name] = {
            ...staticData,
            lastInteraction: eng ? {
              date: eng.date,
              type: eng.type || "Activity",
              summary: eng.summary || "No details logged.",
              owner: null
            } : match.lastContacted ? {
              date: match.lastContacted,
              type: "Activity",
              summary: "Last activity recorded in HubSpot.",
              owner: null
            } : staticData.lastInteraction,
            currentRole: {
              title: match.title || staticData.currentRole?.title || contact.title,
              company: match.company || staticData.currentRole?.company || contact.company,
              startDate: staticData.currentRole?.startDate || null
            },
            matchQuality: "Full match"
          };
        } else {
          newMap[contact.name] = staticData;
        }

        setLoadingSet(prev => {
          const next = new Set(prev);
          next.delete(contact.name);
          return next;
        });
      }

      // Build L1 enrichment map
      const newL1Map = {};
      for (const contact of l1Contacts) {
        const match = hsMap[contact.name];
        if (match) {
          const eng = match.lastEngagement;
          newL1Map[contact.name] = {
            lastInteraction: eng ? {
              type: eng.type,
              date: eng.date,
              summary: eng.summary || null
            } : match.lastContacted ? {
              type: "Activity",
              date: match.lastContacted,
              summary: null
            } : null,
            currentTitle: match.title || contact.title,
            currentCompany: match.company || contact.company,
          };
        }
      }
      setEnrichmentMap(newMap);
      setL1EnrichmentMap(newL1Map);
    } catch (err) {
      console.error("HubSpot fetch failed:", err);
      // Fall back to static enrichment data
      const fallback = {};
      for (const contact of bdContacts) {
        fallback[contact.name] = ENRICHMENT_DATA[contact.name] || null;
      }
      setEnrichmentMap(fallback);
      setLoadingSet(new Set());
    }

    setRefreshing(false);
    setLastRefreshed(new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }));
  }, []);

  const jobChangeCount = Object.values(enrichmentMap).filter(e => e?.jobChange?.detected).length;

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:T.canvas, color:T.carbon, minHeight:"100vh" }}>

      {/* HEADER */}
      <div style={{ padding:"28px 32px 20px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontFamily:"'Arial',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:6 }}>The Trium Group</div>
            <h1 style={{ fontFamily:"'Georgia',serif", fontSize:32, fontWeight:400, margin:"0 0 4px", letterSpacing:"-0.01em" }}>Pod Capacity & BD Tracker</h1>
            <div style={{ fontFamily:"'Arial',sans-serif", fontSize:12, color:T.blueGray }}>3 partners · updated May 11, 2026</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
            <div style={{ display:"flex", gap:8 }}>
              {[["mwc","Meredith",T.brown],["at","Annette",T.blueGray],["ww","William",T.sage]].map(([id,label,color])=>(
                <div key={id} style={{ fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"4px 12px", background:color, color:id==="ww"?T.carbon:"#fff" }}>{label}</div>
              ))}
            </div>
            {/* Refresh button */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {lastRefreshed && !refreshing && (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontFamily:"'Arial',sans-serif", fontSize:10, color:T.blueGrayLight }}>Refreshed {lastRefreshed}</span>
                  {jobChangeCount > 0 && (
                    <span style={{ fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, padding:"2px 8px", background:T.deepYellow, color:"#000", borderRadius:2 }}>{jobChangeCount} job change{jobChangeCount>1?"s":""} detected</span>
                  )}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
                  padding:"8px 18px", cursor:refreshing?"not-allowed":"pointer", border:`1px solid ${T.carbon}`,
                  background:refreshing?T.warmNeutral:T.carbon, color:refreshing?T.blueGray:"#fff",
                  display:"flex", alignItems:"center", gap:8, transition:"background 0.2s",
                }}
              >
                {refreshing ? (
                  <>
                    <span style={{ display:"inline-block", width:10, height:10, border:"2px solid #999", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                    Refreshing...
                  </>
                ) : "Refresh Data"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ padding:"14px 32px", background:T.warmNeutralLight, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.blueGray }}>Overall project runway — all partners</div>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:13, color:T.carbon }}>24 active projects · 10 ending Q2</div>
        </div>
        <div style={{ display:"flex", height:4, background:T.warmNeutral, gap:1 }}>
          <div style={{ width:"29%", background:T.blueGray }} />
          <div style={{ width:"29%", background:T.sage }} />
          <div style={{ width:"42%", background:T.warmNeutral }} />
        </div>
        <div style={{ display:"flex", gap:20, marginTop:6 }}>
          {[[T.blueGray,"Stable (7)"],[T.sage,"Q3 ending (7)"],[T.warmNeutral,"Q2 cliff (10)"]].map(([color,label])=>(
            <div key={label} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:10, height:10, background:color }} />
              <span style={{ fontFamily:"'Arial',sans-serif", fontSize:10, color:T.blueGray }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TOP TABS */}
      <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, padding:"0 32px", background:T.canvas }}>
        {topTabs.map(t=><TopTab key={t.id} label={t.label} active={topTab===t.id} onClick={()=>setTopTab(t.id)} />)}
      </div>

      <div style={{ padding:"28px 32px" }}>

        {/* OVERVIEW */}
        {topTab==="overview" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
              <Metric label="Active Projects" value="24" sub="Meredith · Annette · William" />
              <Metric label="Ending Q2 2026" value="10" sub="≈42% of active load" accent={T.spice} />
              <Metric label="BD Start Signal" value="Now" sub="Already in 2-month window" accent={T.spice} />
              <Metric label="2026 Revenue Booked" value="$5.36M" sub="Laurel H2 just closed — $495K" accent={T.blueGray} />
            </div>

            <AlertCard type="red" title="Immediate BD action required — Q2 cliff" bullets={[
              "10 contracts ending by June 30 — already in the 2-month BD window.",
              "Airtable $478K renewal in traction but not closed.",
              "McDonald's GCS $300K H2 extension in scoping — accelerate.",
              "Sikorsky $150K Next Level Leadership ($250K) in scoping.",
              "Gap IndigoX H2 proposal ($275K) and NewEdge cohesion ($280K) both need to close now.",
            ]} />
            <AlertCard type="amber" title="Watch — Q3 2026" bullets={[
              "Lockheed Aero ELT ($385K), Visa LEAD ($110K), Coates Group ($220K), and NewEdge coaching ($55K) all ending Q3.",
              "Old Navy LT and Old Navy Design & Merch also ending Q3 — start conversations by June.",
              "Lockheed Space follow-on ($425K) in proposal — close now.",
            ]} />
            <AlertCard type="green" title="New win + stable anchors" bullets={[
              "Laurel H2 just closed ($495K, May–Dec 2026) — great momentum for Meredith.",
              "Russell Reynolds runs through Q1 2027 ($1.04M).",
              "Amentum ~$525K and GetYourGuide $250K anchor H2.",
              "Airtable H2 renewal ($468K) is next to close.",
            ]} />

            <div style={{ borderTop:`1px solid ${T.border}`, marginTop:28, paddingTop:24 }}>
              <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:T.blueGray, marginBottom:12 }}>Project end dates by partner</div>
              <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                {[["mwc","Meredith"],["at","Annette"],["ww","William"]].map(([id,label])=>(
                  <SubTab key={id} label={label} active={partnerTab===id} onClick={()=>setPartnerTab(id)} />
                ))}
              </div>

              {partnerTab==="mwc" && <PartnerPanel projects={mwcProjects}
                stats={[{val:"11",label:"Active projects"},{val:"3",label:"Ending Q2"},{val:"$889K",label:"Q2 at risk"}]}
                alert={{title:"Meredith — Q2 cliff: act now",bullets:["Airtable ($478K), Laurel H1 ($385K), and KIVA ($26K) end by June 30.","Airtable H2 renewal ($468K) in traction — needs to close.","Laurel H2 ($495K) just closed — great momentum.","Next: push Airtable renewal, FlixBus ($100K), and Frazier Healthcare ($45K) across the line."]}} />}

              {partnerTab==="at" && <PartnerPanel projects={atProjects}
                stats={[{val:"15",label:"Active projects"},{val:"7",label:"Ending by Q2"},{val:"~$643K",label:"Q2 at risk"}]}
                alert={{title:"Annette — Q2 cliff: act now",bullets:["Buck ended Q1 with no follow-on.","McDonald's GCS ($300K), Sikorsky ($150K), Autodesk ($20K), Mission Produce ($26K), Athleta ($19K), and IndigoX ($28K) all end Q2.","Generate Bio follow-on ($660K) and NewEdge cohesion ($280K) in pipeline — close both now.","Gap pipeline ($82K KBL + $275K IndigoX H2 + others) is rich."]}} />}

              {partnerTab==="ww" && <PartnerPanel projects={wwProjects}
                stats={[{val:"8",label:"Active projects"},{val:"2",label:"Ending Q2"},{val:"$450K",label:"Q2 at risk"}]}
                alert={{title:"William — Q2 cliff: act now",bullets:["Sikorsky SLT ($150K) and McDonald's GCS ($300K) end Q2.","Sikorsky Next Level Leadership ($250K) and F-35 Collaboration ($125K) in scoping — critical to close.","McDonald's GCS H2 extension ($375K+$185K) in scoping.","Relias full engagement ($550K) and Eli Lilly ($100K) also in pipeline."]}} />}
            </div>
          </div>
        )}

        {/* BD CONTACTS — enriched */}
        {topTab==="bd" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontFamily:"'Georgia',serif", fontSize:14, color:T.blueGray, lineHeight:1.6 }}>
                Click any contact to see last HubSpot interaction and ZoomInfo role data. Hit "Refresh Data" to pull live updates.
              </div>
              {!lastRefreshed && !refreshing && (
                <div style={{ fontFamily:"'Arial',sans-serif", fontSize:10, color:T.blueGrayLight, fontStyle:"italic" }}>No data loaded yet — click Refresh Data above</div>
              )}
            </div>
            <FilterBar active={bdFilter} onChange={setBdFilter} options={[
              {value:"all",label:"All"},{value:"at",label:"Annette"},{value:"mwc",label:"Meredith"},{value:"ww",label:"William"},
              {value:"reengage",label:"Re-engage now"},{value:"lost",label:"Closed lost"},
            ]} />
            {filteredBD.map((c,i)=>(
              <BDContactRow
                key={i}
                {...c}
                enrichment={enrichmentMap[c.name]}
                loadingEnrichment={loadingSet.has(c.name)}
              />
            ))}
          </div>
        )}

        {/* LEVEL 1 */}
        {topTab==="l1" && (
          <div>
            <p style={{ fontFamily:"'Georgia',serif", fontSize:14, color:T.blueGray, marginBottom:20, lineHeight:1.6 }}>Level 1 contacts for Annette, Meredith, and William — sorted by days since last activity. Anyone 90+ days cold should be prioritized for outreach.</p>
            <FilterBar active={l1Filter} onChange={setL1Filter} options={[
              {value:"all",label:"All"},{value:"at",label:"Annette"},{value:"mwc",label:"Meredith"},{value:"ww",label:"William"},
              {value:"270",label:"270+ days"},{value:"180",label:"180+ days"},{value:"90",label:"90+ days"},
            ]} />
            {filteredL1.map((c,i)=>{
              const hs = l1EnrichmentMap[c.name];
              const lastInt = hs?.lastInteraction;
              return (
                <div key={i} style={{ borderBottom:`1px solid ${T.borderLight}`, padding:"11px 0" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:2 }}>
                        <span style={{ fontFamily:"'Georgia',serif", fontSize:13, color:T.carbon }}>{c.name}</span>
                        <OwnerTag owner={c.owner} />
                      </div>
                      <div style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGray }}>
                        {hs?.currentTitle || c.title}{(hs?.currentCompany || c.company) ? ` · ${hs?.currentCompany || c.company}` : ""}
                      </div>
                      {lastInt && (
                        <div style={{ fontFamily:"'Arial',sans-serif", fontSize:11, color:T.blueGray, marginTop:4, display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ color:T.blueGrayLight }}>Last touch (HubSpot):</span>
                          <span style={{ color:T.carbon }}>{lastInt.date}</span>
                          <span style={{ color:T.blueGrayLight }}>·</span>
                          <span style={{ fontStyle:"italic" }}>{lastInt.type}</span>
                          {lastInt.summary && <span style={{ color:T.blueGrayLight }}>· {lastInt.summary}</span>}
                        </div>
                      )}
                    </div>
                    <div style={{ flexShrink:0, marginLeft:16, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                      <StaleBadge days={c.days} />
                      <span style={{ fontFamily:"'Arial',sans-serif", fontSize:10, color:T.blueGrayLight }}>Tracker: {c.last}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAST DEALS */}
        {topTab==="deals" && (
          <div>
            <FilterBar active={dealFilter} onChange={setDealFilter} options={[
              {value:"all",label:"All"},{value:"won",label:"Won"},{value:"lost",label:"Lost"},
              {value:"at",label:"Annette"},{value:"mwc",label:"Meredith"},{value:"ww",label:"William"},
            ]} />
            {filteredDeals.map((d,i)=>(
              <ContactRow key={i} name={d.name} title={`${d.date} · ${d.amt}`} owner={d.owner} right={<Badge type={d.stage} />} />
            ))}
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div style={{ padding:"16px 32px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:"'Arial',sans-serif", fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase", color:T.blueGray }}>The Trium Group · Confidential</div>
        <div style={{ fontFamily:"'Arial',sans-serif", fontSize:9, color:T.blueGrayLight }}>
          Pod Tracker + HubSpot + ZoomInfo · Updated May 11, 2026
          {lastRefreshed && ` · Live data as of ${lastRefreshed}`}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
