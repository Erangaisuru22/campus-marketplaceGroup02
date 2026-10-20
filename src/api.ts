import { NativeModules, Platform } from "react-native";
import { Conversation, Listing, Message, ReportItem, StudentUser } from "./types";

// Candidate Host IPs for multi-device network discovery
const DEFAULT_LAN_IP = "192.168.149.215";

function getInitialApiBase(): string {
  // 1. Web Browser: Always use current browser hostname first (prevents CORS / PNA blocks on PC)
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    return `http://${host}:5001/api`;
  }

  // 2. React Native (Expo Go on Android / iOS):
  // Metro dev server bundles from http://<HOST_IP>:8081. Extract the active host IP dynamically!
  try {
    const scriptURL: string = NativeModules?.SourceCode?.scriptURL || "";
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^/:]+)/);
      if (match && match[1] && match[1] !== "localhost" && match[1] !== "127.0.0.1") {
        return `http://${match[1]}:5001/api`;
      }
    }
  } catch {}

  // 3. Explicit environment variable (.env)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  // 4. Default to PC LAN IP (accessible to all phones on Wi-Fi)
  return `http://${DEFAULT_LAN_IP}:5001/api`;
}

let activeApiBase = getInitialApiBase();

function getCandidateBases(): string[] {
  const list = [
    activeApiBase,
    `http://${DEFAULT_LAN_IP}:5001/api`,
    "http://localhost:5001/api",
    "http://127.0.0.1:5001/api",
    "http://10.0.2.2:5001/api",
  ];
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname) {
    list.unshift(`http://${window.location.hostname}:5001/api`);
  }
  return Array.from(new Set(list));
}

async function fetchWithCandidateFallback(
  path: string,
  options: RequestInit = {},
  timeoutMs = 4000
): Promise<Response> {
  const candidates = getCandidateBases();

  // Try current active base first
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${activeApiBase}${path}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok || res.status < 500) {
      return res;
    }
  } catch (err) {
    // Fall through to probe candidates
  }

  // Probe remaining candidates
  for (const candidate of candidates) {
    if (candidate === activeApiBase) continue;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${candidate}${path}`, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok || res.status < 500) {
        activeApiBase = candidate;
        return res;
      }
    } catch {
      // Continue next candidate
    }
  }

  throw new Error(`Failed to reach Campus Marketplace server on any host. Tried: ${candidates.join(", ")}`);
}

export const mongoApi = {
  getBaseUrl(): string {
    return activeApiBase;
  },

  setBaseUrl(url: string) {
    activeApiBase = url.replace(/\/+$/, "");
  },

  async getStatus(): Promise<{ status: string; database: string; databaseName: string; host: string } | null> {
    try {
      const res = await fetchWithCandidateFallback("/status", {}, 3000);
      if (res.ok) {
        const data = await res.json();
        return { ...data, host: activeApiBase };
      }
    } catch {}
    return null;
  },

  // ==========================================
  // LISTINGS
  // ==========================================
  async getListings(): Promise<Listing[] | null> {
    try {
      const res = await fetchWithCandidateFallback("/listings", {}, 3500);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createListing(item: Omit<Listing, "createdAt">): Promise<Listing> {
    const res = await fetchWithCandidateFallback(
      "/listings",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      },
      5000
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with status ${res.status}`);
    }
    return await res.json();
  },

  async updateListingStatus(id: string, status: "active" | "sold"): Promise<boolean> {
    try {
      const res = await fetchWithCandidateFallback(
        `/listings/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
        3000
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteListing(id: string): Promise<boolean> {
    try {
      const res = await fetchWithCandidateFallback(
        `/listings/${id}`,
        { method: "DELETE" },
        3000
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  // ==========================================
  // STUDENTS / USERS
  // ==========================================
  // STUDENTS / USERS
  // ==========================================
  async getStudents(): Promise<StudentUser[] | null> {
    try {
      const res = await fetchWithCandidateFallback("/students", {}, 3000);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async registerStudent(student: {
    fullName: string;
    studentId: string;
    email: string;
    faculty: string;
    password?: string;
  }): Promise<StudentUser> {
    const res = await fetchWithCandidateFallback(
      "/students/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      },
      5000
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Registration failed on server.");
    }
    return await res.json();
  },

  async loginStudent(email: string, pass: string): Promise<StudentUser> {
    const res = await fetchWithCandidateFallback(
      "/students/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      },
      5000
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed on server.");
    }
    return await res.json();
  },

  async toggleStudentBan(uid: string, isBanned: boolean): Promise<boolean> {
    try {
      const res = await fetchWithCandidateFallback(
        `/students/${uid}/ban`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBanned }),
        },
        3000
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateStudentRole(uid: string, role: "student" | "admin"): Promise<boolean> {
    try {
      const res = await fetchWithCandidateFallback(
        `/students/${uid}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        },
        3000
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  async toggleStudentRole(uid: string, role: "student" | "admin"): Promise<boolean> {
    return this.updateStudentRole(uid, role);
  },

  // ==========================================
  // REPORTS
  // ==========================================
  async getReports(): Promise<ReportItem[] | null> {
    try {
      const res = await fetchWithCandidateFallback("/reports", {}, 3000);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createReport(report: Omit<ReportItem, "createdAt" | "status">): Promise<ReportItem | null> {
    try {
      const res = await fetchWithCandidateFallback(
        "/reports",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(report),
        },
        4000
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async resolveReport(id: string, action: "keep" | "delete" | "dismiss", listingId?: string): Promise<boolean> {
    try {
      const status = action === "delete" ? "resolved" : "dismissed";
      const res = await fetchWithCandidateFallback(
        `/reports/${id}/resolve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, action, listingId }),
        },
        3000
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  // ==========================================
  // CONVERSATIONS & MESSAGING
  // ==========================================
  async getConversations(userId?: string): Promise<Conversation[] | null> {
    try {
      const url = userId
        ? `${activeApiBase}/conversations?userId=${encodeURIComponent(userId)}`
        : `${activeApiBase}/conversations`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async sendMessage(
    conversationId: string,
    message: { text: string; senderId: string; senderName?: string; timestamp?: string },
  ): Promise<Message | null> {
    try {
      const res = await fetch(`${activeApiBase}/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
