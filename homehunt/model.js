export const IDENTITIES = Object.freeze([
  { id: "person_a", label: "Person A" },
  { id: "person_b", label: "Person B" },
]);

export const FACT_FILTERS = Object.freeze([
  { key: "attendance_zone", label: "Attendance zone" },
  { key: "high_ceilings", label: "High ceilings" },
  { key: "pool", label: "Pool" },
  { key: "chef_kitchen", label: "Chef's kitchen" },
  { key: "bedroom_fit", label: "Bedroom fit" },
  { key: "suite_potential", label: "Separate suite potential" },
]);

export const FACT_LABELS = Object.freeze({
  school_district: "School district",
  attendance_zone: "Attendance zone",
  high_ceilings: "High ceilings",
  pool: "Pool",
  chef_kitchen: "Chef's kitchen",
  bedroom_fit: "Bedroom fit",
  suite_potential: "Separate suite potential",
});

const YES_VALUES = new Set([true, "yes", "verified-in-zone"]);

export function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function factValue(property, key) {
  const fact = property?.facts?.[key];
  if (!fact || fact.state === "unknown") return "unknown";
  if (key === "attendance_zone") {
    if (fact.state !== "verified") return "unverified";
    return fact.value === "in-zone" ? "yes" : "no";
  }
  if (fact.value === true || fact.value === "yes") return "yes";
  if (fact.value === false || fact.value === "no") return "no";
  return "unknown";
}

export function matchesFilters(property, filters) {
  return FACT_FILTERS.every(({ key }) => {
    const expected = filters[key] ?? "any";
    if (expected === "any") return true;
    return factValue(property, key) === expected;
  });
}

export function filterProperties(properties, filters) {
  return properties.filter((property) => matchesFilters(property, filters));
}

export function freshnessLabel(fact) {
  if (!fact || fact.state === "unknown") return "Unknown";
  if (fact.state === "conflict") return "Conflicting sources";
  const date = fact.verifiedAt || fact.sourceAsOf;
  if (!date) return fact.state === "verified" ? "Verified — date missing" : "Unverified";
  return `${fact.state === "verified" ? "Verified" : "Source claim"} · ${date}`;
}

export function stanceLabel(mark) {
  if (!mark) return "No mark";
  if (mark.veto) return "Veto";
  return ({ love: "Love", maybe: "Maybe", pass: "Pass" })[mark.stance] || "No mark";
}

export function normalizePasscodeWords(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("en-US")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

export function mergeRefresh(existing, refresh) {
  if (!existing) return structuredClone(refresh);
  if (!existing.canonicalAddressKey || !refresh.canonicalAddressKey || existing.canonicalAddressKey !== refresh.canonicalAddressKey) {
    throw new Error("Refusing to merge different or ambiguous canonical addresses.");
  }
  return {
    ...existing,
    ...refresh,
    addressAliases: [...new Set([...(existing.addressAliases || []), ...(refresh.addressAliases || [])])],
    listings: [...(existing.listings || []), ...(refresh.listings || [])],
    facts: { ...(existing.facts || {}), ...(refresh.facts || {}) },
    marks: existing.marks || [],
    comments: existing.comments || [],
  };
}

export function isAffirmativeFact(fact) {
  return fact?.state === "verified" && YES_VALUES.has(fact.value);
}

function ruleMatches(fact, rule) {
  if (!fact || fact.state === "unknown" || fact.state === "conflict" || fact.value == null || fact.value === "unknown") return null;
  if (rule.hardGate && fact.state !== "verified") return null;
  const actual = fact.value;
  if (rule.operator === "equals") return actual === rule.desiredValue;
  if (rule.operator === "at_least") {
    return typeof actual === "number" && typeof rule.desiredValue === "number"
      ? Number.isFinite(actual) && Number.isFinite(rule.desiredValue) && actual >= rule.desiredValue
      : null;
  }
  if (rule.operator === "includes") {
    return typeof actual === "string" && typeof rule.desiredValue === "string"
      ? actual.toLocaleLowerCase("en-US").includes(rule.desiredValue.toLocaleLowerCase("en-US"))
      : null;
  }
  return null;
}

export function scorePreferenceMatch(property, rules, actor) {
  const personalMark = (property.marks || []).find((mark) => mark.actor === actor);
  if (personalMark?.veto) {
    return { actor, status: "veto", score: null, coveragePercent: null, reasons: ["Independent veto"] };
  }
  const activeRules = (rules || []).filter((rule) =>
    rule.actor === actor
    && (rule.evidenceKind === "explicit" || rule.evidenceKind === "confirmed_inference" || rule.review === "confirmed")
    && rule.active !== false
  );
  if (!activeRules.length) {
    return { actor, status: "not_configured", score: null, coveragePercent: null, reasons: ["No confirmed preference rules"] };
  }

  let matchedWeight = 0;
  let knownWeight = 0;
  let totalWeight = 0;
  let blockedUnknown = false;
  let blockedMismatch = false;
  const reasons = [];
  for (const rule of activeRules) {
    const weight = Number(rule.weight || 1);
    totalWeight += weight;
    const result = ruleMatches(property.facts?.[rule.factKey], rule);
    const label = rule.label || rule.factKey;
    if (result === null) {
      reasons.push(`${label}: unknown or unverified`);
      if (rule.hardGate) blockedUnknown = true;
      continue;
    }
    knownWeight += weight;
    if (result) {
      matchedWeight += weight;
      reasons.push(`${label}: match (${property.facts?.[rule.factKey]?.state || "unknown"})`);
    } else {
      reasons.push(`${label}: does not match (${property.facts?.[rule.factKey]?.state || "unknown"})`);
      if (rule.hardGate) blockedMismatch = true;
    }
  }
  const score = totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : null;
  const coveragePercent = totalWeight ? Math.round((knownWeight / totalWeight) * 100) : null;
  const status = blockedMismatch ? "blocked_mismatch" : blockedUnknown ? "blocked_unknown" : "eligible";
  return { actor, status, score, coveragePercent, reasons };
}

export function rankProperties(properties, rules, actor) {
  const order = { eligible: 0, not_configured: 1, blocked_unknown: 2, blocked_mismatch: 3, veto: 4 };
  return [...properties].sort((a, b) => {
    const left = scorePreferenceMatch(a, rules, actor);
    const right = scorePreferenceMatch(b, rules, actor);
    return (order[left.status] - order[right.status])
      || ((right.score ?? -1) - (left.score ?? -1))
      || String(a.displayLabel).localeCompare(String(b.displayLabel));
  });
}
