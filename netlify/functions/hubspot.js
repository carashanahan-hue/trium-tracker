const HUBSPOT_BASE = "https://api.hubapi.com";

async function hs(token, path, options = {}) {
  const res = await fetch(`${HUBSPOT_BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function getContacts(token) {
  const props = [
    "firstname","lastname","email","jobtitle","company",
    "hs_lead_status","hubspot_owner_id","notes_last_contacted",
    "notes_last_activity_date","phone","lifecyclestage"
  ].join(",");

  const data = await hs(token, `/crm/v3/objects/contacts?limit=100&properties=${props}`);
  return data.results || [];
}

async function getLastEngagement(token, contactId) {
  try {
    const assoc = await hs(token,
      `/crm/v4/objects/contacts/${contactId}/associations/engagements?limit=5`
    );
    const ids = (assoc.results || []).map(r => r.toObjectId);
    if (!ids.length) return null;

    // Fetch the most recent engagement
    const engProps = ["hs_engagement_type","hs_activity_type","hs_body_preview",
                      "hs_createdate","hs_timestamp","hubspot_owner_id"].join(",");
    const eng = await hs(token,
      `/crm/v3/objects/engagements/${ids[0]}?properties=${engProps}`
    );
    return eng.properties || null;
  } catch {
    return null;
  }
}

async function getDeals(token) {
  const props = [
    "dealname","amount","dealstage","closedate",
    "hubspot_owner_id","pipeline","hs_deal_stage_probability"
  ].join(",");

  const data = await hs(token, `/crm/v3/objects/deals?limit=100&properties=${props}`);
  return data.results || [];
}

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(parseInt(ts) || ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function engagementType(props) {
  const t = (props.hs_engagement_type || props.hs_activity_type || "").toLowerCase();
  if (t.includes("email")) return "Email";
  if (t.includes("call")) return "Call";
  if (t.includes("meeting")) return "Meeting";
  if (t.includes("note")) return "Note";
  if (t.includes("linkedin")) return "LinkedIn";
  return "Activity";
}

export default async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "HUBSPOT_TOKEN not configured" }), {
      status: 500, headers: corsHeaders
    });
  }

  try {
    const [contacts, deals] = await Promise.all([
      getContacts(token),
      getDeals(token)
    ]);

    // Enrich a sample of contacts with last engagement (limit to avoid timeouts)
    const enriched = await Promise.all(
      contacts.slice(0, 50).map(async (c) => {
        const eng = await getLastEngagement(token, c.id);
        return {
          id: c.id,
          name: `${c.properties.firstname || ""} ${c.properties.lastname || ""}`.trim(),
          email: c.properties.email,
          title: c.properties.jobtitle,
          company: c.properties.company,
          lifecycleStage: c.properties.lifecyclestage,
          leadStatus: c.properties.hs_lead_status,
          lastContacted: formatDate(c.properties.notes_last_contacted),
          lastActivity: formatDate(c.properties.notes_last_activity_date),
          lastEngagement: eng ? {
            type: engagementType(eng),
            date: formatDate(eng.hs_timestamp || eng.hs_createdate),
            summary: eng.hs_body_preview || null
          } : null
        };
      })
    );

    const formattedDeals = deals.map(d => ({
      id: d.id,
      name: d.properties.dealname,
      amount: d.properties.amount ? `$${parseInt(d.properties.amount).toLocaleString()}` : null,
      stage: d.properties.dealstage,
      closeDate: d.properties.closedate,
      probability: d.properties.hs_deal_stage_probability
    }));

    return new Response(JSON.stringify({
      contacts: enriched,
      deals: formattedDeals,
      fetchedAt: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
};

export const config = { path: "/api/hubspot" };
