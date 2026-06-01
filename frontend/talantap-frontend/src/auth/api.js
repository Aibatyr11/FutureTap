import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./tokenStorage";

async function tryRefresh() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch("/api/auth/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;

  const data = await res.json(); // { access, refresh? }
  setTokens({ access: data.access, refresh: data.refresh });
  return data.access;
}

/**
 * apiFetch — fetch с авто-подстановкой Authorization и авто-refresh при 401.
 */
export async function apiFetch(url, options = {}) {
  const access = getAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");

  if (access) headers.set("Authorization", `Bearer ${access}`);

  let res = await fetch(url, { ...options, headers });

  // если access умер — пробуем refresh и повторяем
  if (res.status === 401) {
    const newAccess = await tryRefresh();
    if (!newAccess) {
      clearTokens();
      return res;
    }
    const headers2 = new Headers(options.headers || {});
    headers2.set("Content-Type", headers2.get("Content-Type") || "application/json");
    headers2.set("Authorization", `Bearer ${newAccess}`);
    res = await fetch(url, { ...options, headers: headers2 });
  }

  return res;
}

// ========= auth endpoints =========

export async function loginRequest(email, password) {
  const res = await fetch("/api/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Login failed");

  // backend возвращает: { message, user, tokens:{access,refresh} }
  setTokens({ access: data?.tokens?.access, refresh: data?.tokens?.refresh });
  return data?.user;
}

export async function registerRequest(payload) {
  const res = await fetch("/api/auth/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // красиво склеим ошибки django
    const msg =
      data?.error ||
      (typeof data === "object"
        ? Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
            .join("\n")
        : "Register failed");
    throw new Error(msg);
  }

  setTokens({ access: data?.tokens?.access, refresh: data?.tokens?.refresh });
  return data?.user;
}

export async function meRequest() {
  const res = await apiFetch("/api/users/me/", { method: "GET" });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export function logoutLocal() {
  clearTokens();
}

// ========= enrollments endpoints =========

export async function getEnrollmentsRequest() {
  const res = await apiFetch("/api/enrollments/active/", { method: "GET" });
  if (!res.ok) throw new Error("Failed to fetch enrollments");
  return res.json();
}

export async function createEnrollmentRequest(clubId, coachId, childId = null) {
  const body = {
    club: clubId,
    coach: coachId,
  };
  if (childId) {
    body.child = childId;
  }

  const res = await apiFetch("/api/enrollments/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.detail || "Enrollment failed";
    throw new Error(msg);
  }

  return data;
}

export async function cancelEnrollmentRequest(enrollmentId) {
  const res = await apiFetch(`/api/enrollments/${enrollmentId}/cancel/`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("Failed to cancel enrollment");
  return res.json();
}
