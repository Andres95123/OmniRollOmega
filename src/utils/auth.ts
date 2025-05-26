interface User {
  username: string;
  token: string;
}

const user_key = "OMNIROLL:user";

export function getUser(): User | null {
  const userString = localStorage.getItem(user_key);
  if (userString) {
    try {
      return JSON.parse(userString) as User;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      return null;
    }
  }
  return null;
}

export function setUser(user: User): void {
  localStorage.setItem(user_key, JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem(user_key);
}

export function isLoggedIn(): boolean {
  const user = getUser();
  return user !== null && user.token !== undefined && user.token !== null;
}
