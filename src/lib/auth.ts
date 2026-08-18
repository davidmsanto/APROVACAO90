import { useEffect, useState } from "react";
import { sanitizeText } from "./security";

/* ============ APROVAÇÃO 90 · autenticação & modo teste 24h ============
   Estrutura MVP (client-side). No PWA multiusuário, este módulo vira a
   camada de contratos do Supabase Auth + RLS — as assinaturas permanecem. */

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passHash: string;
  createdAt: number;
  plan: "trial" | "pro";
  proSince?: number;
}

export type PlanStatus =
  | { kind: "pro" }
  | { kind: "trial"; msLeft: number }
  | { kind: "expired" };

export type AuthResult = { ok: true; user: UserRecord } | { ok: false; error: string };

const USERS_KEY = "aprovacao90:users";
const SESSION_KEY = "aprovacao90:session";
export const TRIAL_MS = 24 * 60 * 60 * 1000; // 24 horas
export const DEMO_EMAIL = "demo@aprovacao90.app";

export const dataKeyFor = (userId: string) => `aprovacao90:data:${userId}`;

function readUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const p = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? (p as UserRecord[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: UserRecord[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* quota */
  }
}

function uid(): string {
  try {
    return crypto.randomUUID().slice(0, 12);
  } catch {
    return `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}

/* hash da senha — SHA-256 com salt fixo (MVP; produção usa backend + bcrypt) */
async function hashPass(pw: string): Promise<string> {
  const data = `a90:${pw}`;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* contexto não seguro → fallback */
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return "f" + (h >>> 0).toString(16);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function getSessionUser(): UserRecord | null {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return readUsers().find((u) => u.id === id) ?? null;
  } catch {
    return null;
  }
}

function setSession(id: string | null) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

export async function signup(name: string, email: string, pw: string): Promise<AuthResult> {
  const n = sanitizeText(name, 40);
  const e = email.trim().toLowerCase();
  if (n.length < 2) return { ok: false, error: "Informe seu nome (mín. 2 letras)." };
  if (!EMAIL_RE.test(e)) return { ok: false, error: "E-mail inválido." };
  if (pw.length < 6) return { ok: false, error: "A senha precisa de pelo menos 6 caracteres." };
  const users = readUsers();
  if (users.some((u) => u.email === e)) return { ok: false, error: "Este e-mail já tem conta — faça login." };
  const user: UserRecord = {
    id: uid(),
    name: n,
    email: e,
    passHash: await hashPass(pw),
    createdAt: Date.now(),
    plan: "trial", // modo teste: 24h começam agora
  };
  users.push(user);
  writeUsers(users);
  setSession(user.id);
  return { ok: true, user };
}

export async function login(email: string, pw: string): Promise<AuthResult> {
  const e = email.trim().toLowerCase();
  const users = readUsers();
  const user = users.find((u) => u.email === e);
  if (!user) return { ok: false, error: "Conta não encontrada para este e-mail." };
  if (user.passHash !== (await hashPass(pw))) return { ok: false, error: "Senha incorreta." };
  setSession(user.id);
  return { ok: true, user };
}

export function logout() {
  setSession(null);
}

/** Assinatura mensal (simulada no MVP — gateway real entra no PWA). */
export function upgradeToPro(user: UserRecord): UserRecord {
  const users = readUsers().map((u) =>
    u.id === user.id ? { ...u, plan: "pro" as const, proSince: Date.now() } : u,
  );
  writeUsers(users);
  return users.find((u) => u.id === user.id) ?? { ...user, plan: "pro", proSince: Date.now() };
}

export function trialMsLeft(user: UserRecord): number {
  if (user.plan === "pro") return Infinity;
  return Math.max(0, user.createdAt + TRIAL_MS - Date.now());
}

export function getPlanStatus(user: UserRecord): PlanStatus {
  if (user.plan === "pro") return { kind: "pro" };
  const msLeft = trialMsLeft(user);
  return msLeft > 0 ? { kind: "trial", msLeft } : { kind: "expired" };
}

export function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Relógio vivo do plano — reavalia a cada segundo e detecta a expiração. */
export function usePlanClock(user: UserRecord): PlanStatus {
  const [status, setStatus] = useState<PlanStatus>(() => getPlanStatus(user));
  useEffect(() => {
    if (user.plan === "pro") {
      setStatus({ kind: "pro" });
      return;
    }
    const t = setInterval(() => setStatus(getPlanStatus(user)), 1000);
    return () => clearInterval(t);
  }, [user]);
  return status;
}

/** Conta demo — sempre disponível para testar o produto (trial renovado). */
export async function enterDemo(): Promise<UserRecord> {
  const users = readUsers();
  let demo = users.find((u) => u.email === DEMO_EMAIL);
  if (demo) {
    // renova o modo teste se já expirou, para o preview nunca travar
    if (demo.plan === "trial" && trialMsLeft(demo) <= 0) {
      demo = { ...demo, createdAt: Date.now() };
      writeUsers(users.map((u) => (u.id === demo!.id ? demo! : u)));
    }
  } else {
    demo = {
      id: "demo-a90",
      name: "Estudante Demo",
      email: DEMO_EMAIL,
      passHash: await hashPass("demo90"),
      createdAt: Date.now(),
      plan: "trial",
    };
    users.push(demo);
    writeUsers(users);
  }
  setSession(demo.id);
  return demo;
}

/** Resumo do que o usuário produziu no teste (usado no paywall). */
export function readTrialProgress(userId: string): { days: number; questions: number; minutes: number } {
  try {
    const raw = localStorage.getItem(dataKeyFor(userId));
    if (!raw) return { days: 0, questions: 0, minutes: 0 };
    const s = JSON.parse(raw) as { sessions?: { date: string; minutes: number }[]; questionLogs?: { total: number }[] };
    const sessions = Array.isArray(s.sessions) ? s.sessions : [];
    return {
      days: new Set(sessions.map((x) => x.date)).size,
      questions: (Array.isArray(s.questionLogs) ? s.questionLogs : []).reduce((a, x) => a + (x.total || 0), 0),
      minutes: sessions.reduce((a, x) => a + (x.minutes || 0), 0),
    };
  } catch {
    return { days: 0, questions: 0, minutes: 0 };
  }
}
