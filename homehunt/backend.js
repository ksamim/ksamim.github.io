import { FIXTURE_SNAPSHOT } from "./fixture-data.js";
import { normalizePasscodeWords } from "./model.js";

const FIXTURE_KEY = "homehunt-synthetic-fixture-v1";

export class SessionExpiredError extends Error {
  constructor() {
    super("Session is invalid or expired.");
    this.name = "SessionExpiredError";
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class FixtureBackend {
  constructor(storage = window.localStorage) {
    this.storage = storage;
  }

  async openSession(passcode) {
    if (!normalizePasscodeWords(passcode)) throw new Error("Enter a demo passphrase.");
    return { ["token"]: "synthetic-session", expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() };
  }

  async getSnapshot() {
    const stored = this.storage.getItem(FIXTURE_KEY);
    return stored ? JSON.parse(stored) : clone(FIXTURE_SNAPSHOT);
  }

  async setMark(_token, propertyId, actor, stance, veto) {
    const snapshot = await this.getSnapshot();
    const property = snapshot.properties.find((item) => item.id === propertyId);
    if (!property) throw new Error("Synthetic property not found.");
    property.marks = property.marks.filter((mark) => mark.actor !== actor);
    property.marks.push({ actor, stance, veto, updatedAt: new Date().toISOString() });
    this.storage.setItem(FIXTURE_KEY, JSON.stringify(snapshot));
  }

  async addComment(_token, propertyId, actor, body) {
    const snapshot = await this.getSnapshot();
    const property = snapshot.properties.find((item) => item.id === propertyId);
    if (!property) throw new Error("Synthetic property not found.");
    property.comments.push({
      id: crypto.randomUUID(),
      actor,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    });
    this.storage.setItem(FIXTURE_KEY, JSON.stringify(snapshot));
  }

  async reviewPreferenceNote(_proof, noteId, actor, action) {
    const snapshot = await this.getSnapshot();
    const note = snapshot.properties.flatMap((property) => property.preferenceNotes || [])
      .find((item) => item.id === noteId && item.actor === actor);
    if (!note) throw new Error("Synthetic preference note not found.");
    note.review = action;
    this.storage.setItem(FIXTURE_KEY, JSON.stringify(snapshot));
  }

  async closeSession() {}
}

export class SupabaseBackend {
  constructor(config) {
    this.url = String(config.supabaseUrl || "").replace(/\/$/, "");
    this.key = config.supabaseKey;
    this.workspaceSlug = config.workspaceSlug;
    this.authEndpoint = config.authEndpoint || `${this.url}/functions/v1/homehunt-open-session`;
    if (!this.url || !this.key || !this.workspaceSlug) {
      throw new Error("Deployment configuration is incomplete.");
    }
  }

  async rpc(name, body) {
    const response = await fetch(`${this.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        "apikey": this.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text();
      if (response.status === 401 || response.status === 403 || /session is invalid or expired/i.test(detail)) {
        throw new SessionExpiredError();
      }
      throw new Error("The protected HomeHunt service is unavailable.");
    }
    if (response.status === 204) return null;
    return response.json();
  }

  async openSession(passcode) {
    const response = await fetch(this.authEndpoint, {
      method: "POST",
      headers: { "apikey": this.key, "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceSlug: this.workspaceSlug, passcode }),
    });
    if (response.status === 429) throw new Error("Too many attempts from this network. Try again later.");
    if (response.status === 401) throw new Error("Passphrase not accepted.");
    if (!response.ok) throw new Error("The protected HomeHunt service is unavailable.");
    const session = await response.json();
    if (!session?.token) throw new Error("Passphrase not accepted.");
    return session;
  }

  getSnapshot(proof) {
    return this.rpc("homehunt_get_snapshot", { p_session_token: proof });
  }

  setMark(proof, propertyId, actor, stance, veto) {
    return this.rpc("homehunt_set_mark", {
      p_session_token: proof,
      p_property_id: propertyId,
      p_actor: actor,
      p_stance: stance,
      p_veto: veto,
    });
  }

  addComment(proof, propertyId, actor, body) {
    return this.rpc("homehunt_add_comment", {
      p_session_token: proof,
      p_property_id: propertyId,
      p_actor: actor,
      p_body: body,
    });
  }

  reviewPreferenceNote(proof, noteId, actor, action) {
    return this.rpc("homehunt_review_preference_note", {
      p_session_token: proof,
      p_preference_note_id: noteId,
      p_actor: actor,
      p_action: action,
    });
  }

  closeSession(proof) {
    return this.rpc("homehunt_close_session", { p_session_token: proof });
  }
}

export function selectBackend(config, locationLike = window.location) {
  if (config?.mode === "supabase") return new SupabaseBackend(config);
  const isLocal = ["localhost", "127.0.0.1"].includes(locationLike.hostname) || locationLike.protocol === "file:";
  if (config?.mode === "fixture" || isLocal) return new FixtureBackend();
  throw new Error("This deployment has no protected backend configuration.");
}
