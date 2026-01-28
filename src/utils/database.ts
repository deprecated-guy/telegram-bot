import { User } from './outline';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

interface Db {
  users: User[];
}

const DB_PATH = join(process.cwd(), 'database.json');


export function ensureDbExists(): void {
  if (!existsSync(DB_PATH)) {
    const emptyDb: Db = { users: [] };
    writeFileSync(DB_PATH, JSON.stringify(emptyDb, null, 2), 'utf-8');
  }
}


export function loadUsers(): User[] {
  try {
    ensureDbExists();

    const raw = readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw) as Db;

    return data.users ?? [];
  } catch (e) {
    console.error('Failed to load users:', e);
    return [];
  }
}


export function find(username: string): User | null {
  const users = loadUsers();
  return users.find(u => u.username === username) ?? null;
}


export function save(user: User): boolean {
  const users = loadUsers();

  const exists = users.some(u => u.username === user.username);
  if (exists) {
    return false;
  }

  const updated: Db = {
    users: [...users, user],
  };

  writeFileSync(DB_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  return true;
}
