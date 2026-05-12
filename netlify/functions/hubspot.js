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
  if (!res.ok) throw new Error(`HubSpot ${res.status}: ${await res.text()}`);
  return res.json();
}

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(isNaN(ts) ? ts : parseInt(ts));
  if (d.getFullYear() < 2000) return null;
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

async function searchContact(token, name) {
  const parts = name.trim().split(" ");
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  const props = ["firstname","lastname","jobtitle","company",
    "notes_last_contacted","notes_last_activity_date"].join(",");

  const body = {
    filterGroups: [{
      filters: [{
        propertyName: "lastname",
        operator: "EQ",
        value: lastName
      }, {
        propertyName: "firstname",
        operator: "EQ",
        value: firstName
      }]
    }],
    properties: props.split(","),
    limit: 1
  };

  try {
    const data = await hs(token, "/crm/v3/objects/contacts/search", {
      method: "POST",
      body: JSON.stringify(body)
    });
    return (data.results || [])[0] || null;
  } catch {
    return null;
  }
}

async function getLastEngagement(token, contactId) {
  try {
    const assoc = await hs(token, `/crm/v4/objects/contacts/${contactId}/associations/engagements?limit=3`);
    const ids = (assoc.results || []).map(r => r.toObjectId);
    if (!ids.length) return null;
    const engProps = ["hs_engagement_type","hs_activity_type","hs_body_preview","hs_timestamp","hs_createdate"].join(",");
    const eng = await hs(token, `/crm/v3/objects/engagements/${ids[0]}?properties=${engProps}`);
    return {
      type: engType(eng.properties),
      date: formatDate(eng.properties.hs_timestamp || eng.properties.hs_createdate),
      summary: eng.properties.hs_body_preview || null
    };
  } catch {
    return null;
  }
}

// All BD and L1 contact names to look up
const TARGET_NAMES = [
  "Dana Bishara","Melanie Rosenwasser","Virginia Graham","Ritambhara Kumar",
  "Arturo Poire","Samantha Hammock","Lauren Cipicchio","Noah Glass",
  "Katie Childers","Candice Chafey","Martin Toha","Noel Moore",
  "Jeannette Gessler","Calen Holbrooks","Juan de Antonio","Sundeep Peechu",
  "Ann Wessing","Ade Patton","Aditya Joshi","Nikki Pechet","Vidya Peters",
  "Sharbani Roy","Tazeen Chaudhry","Jeremy Benedict","Kasmira Pawa",
  "Vasily Starostenko","Derek Ingalls","Chris Burrell","Kurt Petersen",
  "Stacie Thomas","Anna Lyons","Fabiola Torres","Theo Agepoulos",
  "Walter Dopplmair","Jane Lauder","Monica McManus","Stephanie Asendorf",
  "John Heyliger"
];

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
    // Search for each target contact by name
    const results = await Promise.all(
      TARGET_NAMES.map(async (name) => {
        const contact = await searchContact(token, name);
        if (!contact) return { name, found: false };

        const lastEngagement = await getLastEngagement(token, contact.id);

        return {
          name,
          found: true,
          title: contact.properties.jobtitle || null,
          company: contact.properties.company || null,
          lastContacted: formatDate(contact.properties.notes_last_contacted),
          lastActivity: formatDate(contact.properties.notes_last_activity_date),
          lastEngagement
        };
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ contacts: results, fetchedAt: new Date().toISOString() })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
