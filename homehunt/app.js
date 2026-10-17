import { selectBackend } from "./backend.js";
import { FACT_FILTERS, FACT_LABELS, IDENTITIES, filterProperties, freshnessLabel, rankProperties, safeHttpUrl, scorePreferenceMatch, stanceLabel } from "./model.js";

const identityKey = "homehunt-selected-identity-v1";
const sessionKey = "homehunt-session-v1";
const config = window.HOMEHUNT_CONFIG || null;
const elements = {
  identity: document.querySelector("#identity-select"),
  filters: document.querySelector("#filter-grid"),
  clear: document.querySelector("#clear-filters"),
  grid: document.querySelector("#property-grid"),
  count: document.querySelector("#result-count"),
  gate: document.querySelector("#gate-dialog"),
  gateForm: document.querySelector("#gate-form"),
  passcode: document.querySelector("#passcode-input"),
  gateError: document.querySelector("#gate-error"),
  demoNote: document.querySelector("#demo-note"),
  template: document.querySelector("#property-template"),
  toast: document.querySelector("#toast"),
  lock: document.querySelector("#lock-app"),
};

let backend;
let expiryTimer;
let sessionRecord;
try {
  sessionRecord = JSON.parse(sessionStorage.getItem(sessionKey));
} catch {
  sessionRecord = null;
}
let snapshot = { properties: [] };
let filters = Object.fromEntries(FACT_FILTERS.map(({ key }) => [key, "any"]));

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function identity() {
  return elements.identity.value;
}

function sessionProof() {
  return sessionRecord?.token || null;
}

function identities() {
  return snapshot.identities?.length ? snapshot.identities : IDENTITIES;
}

function labelForIdentity(id) {
  return identities().find((person) => person.id === id)?.label || "Unknown";
}

function renderIdentitySelector() {
  const people = identities();
  elements.identity.innerHTML = people.map((person) =>
    `<option value="${escapeHtml(person.id)}">${escapeHtml(person.label)}</option>`
  ).join("");
  const saved = localStorage.getItem(identityKey);
  elements.identity.value = people.some((person) => person.id === saved)
    ? saved
    : snapshot.defaultIdentityKey || people[0]?.id || "";
}

function toast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => { elements.toast.hidden = true; }, 3000);
}

function sourceAddressText(address) {
  if (!address) return "Address unavailable";
  return [address.addressLine, address.unit, address.locality, address.region, address.postalCode].filter(Boolean).join(", ");
}

function renderFilters() {
  const choices = [
    ["any", "Any evidence"],
    ["yes", "Yes / verified zone"],
    ["no", "No / outside zone"],
    ["unverified", "Unverified zone"],
    ["unknown", "Unknown"],
  ];
  elements.filters.innerHTML = FACT_FILTERS.map(({ key, label }) => `
    <label class="filter-control">
      <span>${label}</span>
      <select data-filter="${key}" aria-label="Filter by ${label}">
        ${choices
          .filter(([value]) => key === "attendance_zone" || value !== "unverified")
          .map(([value, title]) => `<option value="${value}">${title}</option>`)
          .join("")}
      </select>
    </label>
  `).join("");
}

function factDisplay(key, fact) {
  if (!fact || fact.state === "unknown") return "Unknown";
  if (key === "attendance_zone") {
    if (fact.state === "conflict") return "Conflicting evidence";
    if (fact.state !== "verified") return "Not verified";
    return fact.value === "in-zone" ? "Verified in zone" : "Verified outside zone";
  }
  if (key === "school_district") return String(fact.value || "Unknown");
  if (fact.value === "yes" || fact.value === true) return "Yes";
  if (fact.value === "no" || fact.value === false) return "No";
  return "Unknown";
}

function renderFacts(property, target) {
  const keys = ["school_district", ...FACT_FILTERS.map(({ key }) => key)];
  target.innerHTML = keys.map((key) => {
    const fact = property.facts?.[key];
    return `<div class="fact" data-state="${fact?.state || "unknown"}">
      <span class="fact-label">${FACT_LABELS[key]}</span>
      <span class="fact-value">${escapeHtml(factDisplay(key, fact))}</span>
      <small>${escapeHtml(freshnessLabel(fact))}</small>
    </div>`;
  }).join("");
}

function renderMarks(property, card) {
  const summary = card.querySelector(".mark-summary");
  summary.innerHTML = identities().map((person) => {
    const mark = property.marks.find((item) => item.actor === person.id);
    return `<span class="person-mark${mark?.veto ? " is-veto" : ""}">${escapeHtml(person.label)}: ${escapeHtml(stanceLabel(mark))}</span>`;
  }).join("");

  const ownMark = property.marks.find((item) => item.actor === identity());
  card.querySelectorAll("[data-stance]").forEach((button) => {
    const pressed = button.dataset.stance === "veto" ? Boolean(ownMark?.veto) : ownMark?.stance === button.dataset.stance && !ownMark?.veto;
    button.setAttribute("aria-pressed", String(pressed));
    button.addEventListener("click", () => saveMark(property.id, button.dataset.stance));
  });
}

function renderComments(property, card) {
  const list = card.querySelector(".comments-list");
  list.innerHTML = property.comments.length
    ? property.comments.map((comment) => `<div class="comment"><span class="comment-meta">${escapeHtml(labelForIdentity(comment.actor))} · ${escapeHtml(new Date(comment.createdAt).toLocaleDateString())}</span>${escapeHtml(comment.body)}</div>`).join("")
    : '<p class="empty-note">No comments yet.</p>';
  const form = card.querySelector(".comment-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const field = form.querySelector("textarea");
    const body = field.value.trim();
    if (!body) return;
    try {
      await backend.addComment(sessionProof(), property.id, identity(), body);
      field.value = "";
      await refresh({ propertyId: property.id, selector: "textarea" });
    } catch (error) {
      handleError(error);
    }
  });
}

function renderInsights(property, card) {
  const list = card.querySelector(".insights-list");
  const notes = property.preferenceNotes || [];
  if (!notes.length) {
    list.innerHTML = '<p class="empty-note">No preference notes yet.</p>';
    return;
  }
  list.innerHTML = notes.map((note) => {
    const confidence = note.kind === "inferred" && note.confidence != null
      ? ` · ${Math.round(Number(note.confidence) * 100)}% confidence`
      : "";
    const review = note.review ? ` · ${note.review}` : "";
    const canReview = note.actor === identity() && note.kind !== "explicit";
    return `<div class="insight" data-note-id="${escapeHtml(note.id)}">
      <span class="insight-meta">${escapeHtml(labelForIdentity(note.actor))} · ${escapeHtml(note.kind)}${escapeHtml(confidence)}${escapeHtml(review)}</span>
      <p>${escapeHtml(note.note)}</p>
      ${canReview ? `<div class="insight-review">
        <button type="button" data-review="confirmed" aria-pressed="${note.review === "confirmed"}">Confirm</button>
        <button type="button" data-review="dismissed" aria-pressed="${note.review === "dismissed"}">Dismiss</button>
      </div>` : ""}
    </div>`;
  }).join("");
  list.querySelectorAll("[data-review]").forEach((button) => {
    const noteId = button.closest("[data-note-id]").dataset.noteId;
    button.addEventListener("click", () => reviewPreferenceNote(noteId, button.dataset.review));
  });
}

function matchHeadline(match) {
  if (match.status === "veto") return "Veto — not ranked";
  if (match.status === "blocked_unknown") return "Needs info — hard gate unknown";
  if (match.status === "blocked_mismatch") return "Blocked — hard gate mismatch";
  if (match.status === "not_configured") return "Not configured";
  return match.score == null ? "Eligible — score pending" : `${match.score}% match`;
}

function renderRankings(property, card) {
  const list = card.querySelector(".rank-list");
  list.innerHTML = identities().map((person) => {
    const match = scorePreferenceMatch(property, snapshot.preferenceRules || [], person.id);
    return `<details class="rank-item" data-status="${match.status}">
      <summary>${escapeHtml(person.label)} · ${escapeHtml(matchHeadline(match))}${match.coveragePercent == null ? "" : ` · ${escapeHtml(match.coveragePercent)}% evidence coverage`}</summary>
      <ul>${match.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
    </details>`;
  }).join("");
}

function renderVisits(property, card) {
  const list = card.querySelector(".visits-list");
  const visits = property.upcomingVisits || [];
  if (!visits.length) {
    list.innerHTML = '<p class="empty-note">No advertised open house or confirmed appointment.</p>';
    return;
  }
  list.innerHTML = visits.map((visit) => {
    const kind = visit.kind === "confirmed_appointment" ? "Confirmed appointment" : "Advertised open house";
    const start = new Date(visit.startAt);
    const when = Number.isNaN(start.valueOf()) ? "Time unknown" : start.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: visit.timezone || undefined,
    });
    const verified = visit.lastVerifiedAt ? `Last verified ${new Date(visit.lastVerifiedAt).toLocaleDateString()}` : "Verification date unknown";
    return `<div class="visit" data-status="${escapeHtml(visit.status || "unknown")}">
      <strong>${escapeHtml(kind)} · ${escapeHtml(when)}</strong>
      <span>${escapeHtml(visit.status || "unknown")} · ${escapeHtml(verified)} · Source: ${escapeHtml(visit.sourceLabel || "unknown")}</span>
      <span>Reminder: ${escapeHtml(visit.reminderState || "not configured")} · Calendar availability: ${escapeHtml(visit.calendarAvailability || "unknown")}</span>
    </div>`;
  }).join("");
}

function renderProperties() {
  const properties = rankProperties(
    filterProperties(snapshot.properties || [], filters),
    snapshot.preferenceRules || [],
    identity(),
  );
  elements.count.textContent = `${properties.length} ${properties.length === 1 ? "home" : "homes"}`;
  elements.grid.innerHTML = "";
  if (!properties.length) {
    elements.grid.innerHTML = '<p class="empty-note">No homes match every selected evidence filter.</p>';
    return;
  }
  properties.forEach((property) => {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    card.dataset.propertyId = property.id;
    card.querySelector("h3").textContent = property.displayLabel;
    const statusState = property.listingStatusState && property.listingStatusState !== "verified"
      ? ` · ${property.listingStatusState}`
      : "";
    card.querySelector(".status-pill").textContent = `${property.listingStatus || "Unknown status"}${statusState}`;
    card.querySelector(".address-line").textContent = sourceAddressText(property.sourceAddress);
    const link = card.querySelector(".listing-link");
    const href = safeHttpUrl(property.listingUrl);
    if (href) link.href = href; else link.remove();
    renderFacts(property, card.querySelector(".fact-grid"));
    renderRankings(property, card);
    renderVisits(property, card);
    renderMarks(property, card);
    renderComments(property, card);
    renderInsights(property, card);
    elements.grid.append(card);
  });
}

async function saveMark(propertyId, stance) {
  try {
    await backend.setMark(sessionProof(), propertyId, identity(), stance === "veto" ? "pass" : stance, stance === "veto");
    await refresh({ propertyId, selector: `[data-stance="${stance}"]` });
  } catch (error) {
    handleError(error);
  }
}

async function reviewPreferenceNote(noteId, action) {
  try {
    await backend.reviewPreferenceNote(sessionProof(), noteId, identity(), action);
    await refresh({ noteId, selector: `[data-review="${action}"]` });
  } catch (error) {
    handleError(error);
  }
}

function restoreFocus(target) {
  if (!target) return;
  const root = target.propertyId
    ? elements.grid.querySelector(`[data-property-id="${CSS.escape(target.propertyId)}"]`)
    : target.noteId
      ? elements.grid.querySelector(`[data-note-id="${CSS.escape(target.noteId)}"]`)
      : null;
  root?.querySelector(target.selector)?.focus();
}

function lockApp(message = "HomeHunt is locked.") {
  window.clearTimeout(expiryTimer);
  sessionStorage.removeItem(sessionKey);
  sessionRecord = null;
  snapshot = { properties: [], identities: IDENTITIES };
  elements.grid.replaceChildren();
  elements.count.textContent = "";
  elements.identity.innerHTML = '<option value="">Locked</option>';
  elements.lock.hidden = true;
  elements.gateError.textContent = message;
  if (!elements.gate.open) elements.gate.showModal();
  elements.passcode.focus();
}

async function lockAndRevoke() {
  const proof = sessionProof();
  lockApp();
  if (proof) {
    try { await backend.closeSession(proof); } catch { /* Local lock already completed. */ }
  }
}

function armSessionExpiry() {
  window.clearTimeout(expiryTimer);
  const remaining = new Date(sessionRecord?.expiresAt).valueOf() - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) {
    lockApp("Your session expired. Enter the passphrase again.");
    return false;
  }
  expiryTimer = window.setTimeout(() => lockApp("Your session expired. Enter the passphrase again."), remaining);
  return true;
}

function handleError(error) {
  if (error?.name === "SessionExpiredError") lockApp("Your session expired. Enter the passphrase again.");
  else toast(error.message);
}

async function refresh(focusTarget = null) {
  try {
    snapshot = await backend.getSnapshot(sessionProof());
    renderIdentitySelector();
    elements.lock.hidden = false;
    renderProperties();
    restoreFocus(focusTarget);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function unlock(passcode) {
  sessionRecord = await backend.openSession(passcode);
  if (!sessionRecord?.token || !sessionRecord?.expiresAt) throw new Error("The protected HomeHunt service returned an invalid session.");
  sessionStorage.setItem(sessionKey, JSON.stringify(sessionRecord));
  if (!armSessionExpiry()) return;
  await refresh();
  elements.gate.close();
}

async function initialize() {
  renderFilters();
  elements.identity.addEventListener("change", () => {
    localStorage.setItem(identityKey, identity());
    renderProperties();
  });
  elements.filters.addEventListener("change", (event) => {
    const key = event.target.dataset.filter;
    if (!key) return;
    filters[key] = event.target.value;
    renderProperties();
  });
  elements.clear.addEventListener("click", () => {
    filters = Object.fromEntries(FACT_FILTERS.map(({ key }) => [key, "any"]));
    elements.filters.querySelectorAll("select").forEach((select) => { select.value = "any"; });
    renderProperties();
  });
  elements.lock.addEventListener("click", lockAndRevoke);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && sessionRecord && new Date(sessionRecord.expiresAt).valueOf() <= Date.now()) {
      lockApp("Your session expired. Enter the passphrase again.");
    }
  });

  try {
    backend = selectBackend(config);
    elements.demoNote.hidden = backend.constructor.name !== "FixtureBackend";
    if (sessionRecord && armSessionExpiry()) {
      try { await refresh(); return; } catch { sessionRecord = null; }
    }
  } catch (error) {
    elements.gateError.textContent = error.message;
    elements.passcode.disabled = true;
    elements.gateForm.querySelector("button").disabled = true;
  }
  elements.gate.showModal();
  elements.passcode.focus();
}

elements.gateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.gateError.textContent = "";
  try {
    await unlock(elements.passcode.value);
    elements.passcode.value = "";
  } catch (error) {
    elements.gateError.textContent = error.message;
  }
});

initialize();
