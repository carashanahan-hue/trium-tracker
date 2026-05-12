const HUBSPOT_BASE = "https://api.hubapi.com";

async function hs(token, path) {
  const res = await fetch(`${HUBSPOT_BASE}${path}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) throw new Error(`HubSpot ${res.status}: ${await res.text()}`);
  return res.json();
}

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(isNaN(ts) ? ts : parseInt(ts));
  if (d.getFullYear() < 2000) return null; // filter out epoch/bad dates
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function engType(props) {
  const t = (props.hs_engagement_type || props.hs_activity_type || "").toLowerCase();
  if (t.includes("email")) return "Email";
  if (t.includes("call")) return "Call";
  if (t.includes("meeting")) return "Meeting";
  if (t.includes("note")) return "Note";
  return "Activity";
}

exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "HUBSPOT_TOKEN not set" }) };
  }

  try {
    const props = ["firstname","lastname","email","jobtitle","company",
      "notes_last_contacted","notes_last_activity_date"].join(",");

    // Paginate through all contacts (up to 500)
    let contacts = [];
    let after = null;
    for (let i = 0; i < 5; i++) {
      const url = `/crm/v3/objects/contacts?limit=100&properties=${props}${after ? `&after=${after}` : ""}`;
      const page = await hs(token, url);
      contacts = contacts.concat(page.results || []);
      if (!page.paging || !page.paging.next || !page.paging.next.after) break;
      after = page.paging.next.after;
    }

    // For each contact, try to get their last engagement
    const enriched = await Promise.all(
      contacts.map(async (c) => {
        let lastEngagement = null;
        try {
          const assoc = await hs(token, `/crm/v4/objects/contacts/${c.id}/associations/engagements?limit=3`);
          const ids = (assoc.results || []).map(r => r.toObjectId);
          if (ids.length) {
            const engProps = ["hs_engagement_type","hs_activity_type","hs_body_preview","hs_timestamp","hs_createdate"].join(",");
            const eng = await hs(token, `/crm/v3/objects/engagements/${ids[0]}?properties=${engProps}`);
            lastEngagement = {
              type: engType(eng.properties),
              date: formatDate(eng.properties.hs_timestamp || eng.properties.hs_createdate),
              summary: eng.properties.hs_body_preview || null
            };
          }
        } catch {}

        return {
          id: c.id,
          name: `${c.properties.firstname || ""} ${c.properties.lastname || ""}`.trim(),
          title: c.properties.jobtitle || null,
          company: c.properties.company || null,
          lastContacted: formatDate(c.properties.notes_last_contacted),
          lastActivity: formatDate(c.properties.notes_last_activity_date),
          lastEngagement
        };
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ contacts: enriched, fetchedAt: new Date().toISOString() })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
