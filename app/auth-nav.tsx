"use client";

import { useEffect, useState } from "react";
import { LoginButton } from "./login-button";

type CurrentUser = {
  id: string;
  displayName: string;
  discordAvatar: string | null;
};

export function AuthNav() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  if (!user) {
    return (
      <div className="auth-nav auth-nav--guest">
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="auth-nav">
      <span className="auth-user">
        {user.discordAvatar ? (
          <img
            src={user.discordAvatar}
            alt={`Avatar de ${user.displayName}`}
            className="auth-avatar"
          />
        ) : (
          <span className="auth-avatar auth-avatar-fallback" aria-hidden="true">
            {user.displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span>{user.displayName}</span>
      </span>
      <form action="/api/auth/logout" method="post">
        <button type="submit" className="logout-btn">Salir</button>
      </form>
    </div>
  );
}
