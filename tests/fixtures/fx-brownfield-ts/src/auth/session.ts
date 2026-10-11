// fx-brownfield-ts: session and login with lockout.
export interface User {
  name: string;
}

let user: User | null = null;
const failures = new Map<string, number>();

export function login(name: string, password: string): boolean {
  if ((failures.get(name) ?? 0) >= 5) return false;
  if (password !== "secret") {
    failures.set(name, (failures.get(name) ?? 0) + 1);
    return false;
  }
  user = { name };
  return true;
}

export function currentUser(): User | null {
  return user;
}
