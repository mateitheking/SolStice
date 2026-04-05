import { User } from '../types';
import { storageService } from './storageService';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEMO_EMAIL = 'demo@trading.app';
const DEMO_PASSWORD = 'demo123';

const makeUser = (email: string, isGuest = false): User => ({
  id: `${Date.now()}`,
  email,
  isGuest,
  createdAt: new Date().toISOString(),
});

const ensureSeedUsers = async () => {
  const users = await storageService.getUsers();
  const hasDemo = users.some((item) => item.email.toLowerCase() === DEMO_EMAIL.toLowerCase());

  if (hasDemo) {
    return users;
  }

  const nextUsers = [...users, { email: DEMO_EMAIL, password: DEMO_PASSWORD }];
  await storageService.setUsers(nextUsers);
  return nextUsers;
};

export const authService = {
  async login(email: string, password: string): Promise<User> {
    await wait(900);

    const users = await ensureSeedUsers();
    const found = users.find((item) => item.email.toLowerCase() === email.toLowerCase());

    if (!found || found.password !== password) {
      throw new Error('Invalid email or password');
    }

    return makeUser(found.email);
  },

  async register(email: string, password: string): Promise<User> {
    await wait(1100);

    const users = await ensureSeedUsers();
    const exists = users.some((item) => item.email.toLowerCase() === email.toLowerCase());

    if (exists) {
      throw new Error('User already exists');
    }

    const nextUsers = [...users, { email, password }];
    await storageService.setUsers(nextUsers);

    return makeUser(email);
  },

  async continueAsGuest(): Promise<User> {
    await wait(450);
    return makeUser('guest@ai-trading.app', true);
  },
};
