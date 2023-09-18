import { DISCORD_LINK } from "utils/constants";

export function DiscordLink() {
  return (
    <a
      href={DISCORD_LINK}
      className="underline underline-offset-2"
      target="_blank"
    >
      Discord
    </a>
  );
}
