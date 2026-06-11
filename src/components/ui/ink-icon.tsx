/**
 * Ink type icon component using official Ravensburger ink icons.
 */

interface InkIconProps {
  ink: string;
  size?: number;
  className?: string;
}

export function InkIcon({ ink, size = 16, className = "" }: InkIconProps) {
  const normalized = ink.toLowerCase().trim();
  const validInks = ["amber", "amethyst", "emerald", "ruby", "sapphire", "steel"];

  if (!validInks.includes(normalized)) {
    return <span className={`inline-block text-xs text-muted ${className}`}>{ink}</span>;
  }

  return (
    <img
      src={`/icons/${normalized}.png`}
      alt={ink}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
