export function LoginButton({
  className = "discord-login-btn",
  label = "Entrar con Discord",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a className={className} href="/login/discord">
      <DiscordIcon />
      {label}
    </a>
  );
}

function DiscordIcon() {
  return (
    <svg
      aria-hidden="true"
      className="discord-icon"
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M20.32 4.37A19.8 19.8 0 0 0 15.36 2.8a13.7 13.7 0 0 0-.64 1.34 18.4 18.4 0 0 0-5.44 0 12.8 12.8 0 0 0-.65-1.34 19.7 19.7 0 0 0-4.96 1.58C.54 9.05-.33 13.6.1 18.08a20 20 0 0 0 6.08 3.08c.49-.66.92-1.36 1.3-2.1-.71-.27-1.39-.6-2.03-.97.17-.13.34-.26.5-.4a14.1 14.1 0 0 0 12.1 0c.17.14.33.27.5.4-.64.38-1.32.7-2.03.97.38.74.81 1.44 1.3 2.1a20 20 0 0 0 6.08-3.08c.5-5.2-.86-9.72-3.58-13.71ZM8.02 15.32c-1.18 0-2.15-1.08-2.15-2.4 0-1.33.95-2.41 2.15-2.41 1.2 0 2.17 1.09 2.15 2.4 0 1.33-.95 2.41-2.15 2.41Zm7.96 0c-1.18 0-2.15-1.08-2.15-2.4 0-1.33.95-2.41 2.15-2.41 1.2 0 2.17 1.09 2.15 2.4 0 1.33-.95 2.41-2.15 2.41Z"
      />
    </svg>
  );
}
