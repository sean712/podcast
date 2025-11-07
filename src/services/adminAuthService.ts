import { User } from '@supabase/supabase-js';

const OWNER_EMAIL = 'sean.ogrady712@gmail.com';

export function isOwner(user: User | null): boolean {
  if (!user || !user.email) {
    return false;
  }
  return user.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

export function getOwnerEmail(): string {
  return OWNER_EMAIL;
}
