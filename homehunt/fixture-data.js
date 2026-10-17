const makeAddress = (addressLine, locality, region, postalCode, unit = "") => ({
  addressLine,
  unit,
  locality,
  region,
  postalCode,
});

const fact = (value, state, sourceAsOf, verifiedAt = null) => ({
  value,
  state,
  sourceAsOf,
  verifiedAt,
  sourceLabel: state === "verified" ? "Synthetic verifier" : "Synthetic listing",
});

const addresses = [
  makeAddress("100 Example Lane", "Sampleton", "GA", "30000"),
  makeAddress("24 Orchard Demo Court", "Sampleton", "GA", "30001"),
  makeAddress("7 Placeholder Terrace", "Illustration", "GA", "30002", "Unit A"),
];

// Production canonical keys are generated only by PostgreSQL. These constants
// are synthetic fixture outputs, not a second ingestion implementation.
const canonicalKeys = [
  "100 EXAMPLE LANE|NO UNIT|SAMPLETON|GA|30000",
  "24 ORCHARD DEMO COURT|NO UNIT|SAMPLETON|GA|30001",
  "7 PLACEHOLDER TERRACE|UNIT A|ILLUSTRATION|GA|30002",
];

export const FIXTURE_SNAPSHOT = {
  generatedAt: "2026-10-17T12:00:00Z",
  fixture: true,
  defaultIdentityKey: "person_a",
  identities: [
    { id: "person_a", label: "Person A" },
    { id: "person_b", label: "Person B" },
  ],
  preferenceRules: [
    { id: "fixture-rule-a", actor: "person_a", factKey: "pool", label: "Pool", operator: "equals", desiredValue: "yes", weight: 2, hardGate: false, evidenceKind: "explicit", active: true },
    { id: "fixture-rule-b", actor: "person_b", factKey: "high_ceilings", label: "High ceilings", operator: "equals", desiredValue: "yes", weight: 3, hardGate: true, evidenceKind: "explicit", active: true }
  ],
  properties: [
    {
      id: "11111111-a111-4111-8111-a11111111111",
      canonicalAddressKey: canonicalKeys[0],
      displayLabel: "Example Lane",
      sourceAddress: addresses[0],
      addressAliases: ["100 Example Ln"],
      listingStatus: "active",
      listingStatusState: "claimed",
      listingUrl: "https://example.com/listings/example-lane",
      priceLabel: "Price withheld in demo",
      facts: {
        school_district: fact("Sampleton District", "claimed", "2026-10-16"),
        attendance_zone: fact("in-zone", "verified", "2026-10-15", "2026-10-15"),
        high_ceilings: fact("yes", "verified", "2026-10-16", "2026-10-16"),
        pool: fact("no", "verified", "2026-10-16", "2026-10-16"),
        chef_kitchen: fact("yes", "claimed", "2026-10-16"),
        bedroom_fit: fact("yes", "verified", "2026-10-16", "2026-10-16"),
        suite_potential: fact("unknown", "unknown", null),
      },
      marks: [
        { actor: "person_a", stance: "maybe", veto: false, updatedAt: "2026-10-17T11:00:00Z" },
      ],
      comments: [
        { id: "fixture-comment-1", actor: "person_a", body: "Good natural light; verify the kitchen layout in person.", createdAt: "2026-10-17T11:05:00Z" },
      ],
      preferenceNotes: [
        {
          id: "fixture-preference-a",
          actor: "person_a",
          categoryKey: "natural_light",
          kind: "inferred",
          note: "Synthetic pattern: natural light may be worth asking about again.",
          confidence: 0.55,
          sourceKind: "synthetic_marks",
          sourceEffectiveAt: "2026-10-17T11:05:00Z",
          review: null
        }
      ],
      upcomingVisits: [],
    },
    {
      id: "22222222-b222-4222-8222-b22222222222",
      canonicalAddressKey: canonicalKeys[1],
      displayLabel: "Orchard Demo Court",
      sourceAddress: addresses[1],
      addressAliases: [],
      listingStatus: "active",
      listingStatusState: "claimed",
      listingUrl: "https://example.com/listings/orchard-demo",
      priceLabel: "Price withheld in demo",
      facts: {
        school_district: fact("Example County Schools", "claimed", "2026-10-14"),
        attendance_zone: fact("unknown", "unknown", null),
        high_ceilings: fact("yes", "claimed", "2026-10-14"),
        pool: fact("yes", "verified", "2026-10-14", "2026-10-15"),
        chef_kitchen: fact("yes", "verified", "2026-10-14", "2026-10-15"),
        bedroom_fit: fact("unknown", "unknown", null),
        suite_potential: fact("yes", "claimed", "2026-10-14"),
      },
      marks: [],
      comments: [],
      preferenceNotes: [],
      upcomingVisits: [
        {
          id: "fixture-visit-a",
          kind: "advertised_open_house",
          startAt: "2026-10-18T16:00:00Z",
          endAt: "2026-10-18T19:00:00Z",
          timezone: "America/New_York",
          status: "scheduled",
          sourceLabel: "Synthetic listing",
          lastVerifiedAt: "2026-10-17T12:00:00Z",
          cancelledAt: null,
          reminderState: "not_configured",
          calendarAvailability: "unknown"
        }
      ],
    },
    {
      id: "33333333-c333-4333-8333-c33333333333",
      canonicalAddressKey: canonicalKeys[2],
      displayLabel: "Placeholder Terrace",
      sourceAddress: addresses[2],
      addressAliases: [],
      listingStatus: "pending",
      listingStatusState: "verified",
      listingUrl: "https://example.com/listings/placeholder-terrace",
      priceLabel: "Price withheld in demo",
      facts: {
        school_district: fact("Illustration District", "claimed", "2026-10-10"),
        attendance_zone: fact("out-of-zone", "conflict", "2026-10-10"),
        high_ceilings: fact("no", "verified", "2026-10-10", "2026-10-12"),
        pool: fact("unknown", "unknown", null),
        chef_kitchen: fact("no", "claimed", "2026-10-10"),
        bedroom_fit: fact("yes", "claimed", "2026-10-10"),
        suite_potential: fact("yes", "verified", "2026-10-10", "2026-10-12"),
      },
      marks: [
        { actor: "person_b", stance: "pass", veto: true, updatedAt: "2026-10-16T18:00:00Z" },
      ],
      comments: [
        { id: "fixture-comment-2", actor: "person_b", body: "Independent demo veto; this remains separate from the other view.", createdAt: "2026-10-16T18:01:00Z" },
      ],
      preferenceNotes: [],
      upcomingVisits: [],
    },
  ],
};
