import { DISCORD_LINK, GITHUB_LINK, GOOGLE_FORMS_LINK } from "utils/constants";

function SimpleLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="underline underline-offset-2" target="_blank">
      {label}
    </a>
  );
}

export function DiscordLink() {
  return <SimpleLink href={DISCORD_LINK} label="Discord" />;
}

export function GoogleFormLink() {
  return <SimpleLink href={GOOGLE_FORMS_LINK} label="Google Form" />;
}

export function GitHubLink() {
  return <SimpleLink href={GITHUB_LINK} label="GitHub" />;
}
