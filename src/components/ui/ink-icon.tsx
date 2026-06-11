/**
 * Ink type icon component using official Ravensburger ink icons.
 * Supports single color and dual-color split rendering.
 */

interface InkIconProps {
  ink: string; // single color "Sapphire" or dual "Sapphire,Steel"
  size?: number;
  className?: string;
}

const VALID_INKS = ["amber", "amethyst", "emerald", "ruby", "sapphire", "steel"];

export function InkIcon({ ink, size = 16, className = "" }: InkIconProps) {
  const colors = ink.split(",").map((c) => c.trim().toLowerCase());

  // Single color
  if (colors.length === 1) {
    const normalized = colors[0];
    if (!VALID_INKS.includes(normalized)) {
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

  // Dual color — left half of first, right half of second
  const [color1, color2] = colors;
  if (!VALID_INKS.includes(color1) || !VALID_INKS.includes(color2)) {
    return <span className={`inline-block text-xs text-muted ${className}`}>{ink}</span>;
  }

  return (
    <span className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <img
        src={`/icons/${color1}.png`}
        alt={color1}
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ width: size, height: size }}
      />
      <img
        src={`/icons/${color2}.png`}
        alt={color2}
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ width: size, height: size, clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)" }}
      />
    </span>
  );
}

/**
 * Cost icon — shows the ink cost value inside either an inkwell or inkcost icon.
 * inkable=true → inkwell.svg, inkable=false → inkcost.svg
 */
interface CostIconProps {
  cost: number;
  inkable?: boolean | null;
  size?: number;
  className?: string;
}

export function CostIcon({ cost, inkable, size = 20, className = "" }: CostIconProps) {
  const icon = inkable ? "/icons/inkwell.svg" : "/icons/inkcost.svg";

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={icon}
        alt={inkable ? "Inkable" : "Not inkable"}
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ width: size, height: size }}
      />
      <span
        className="relative text-white font-bold z-10"
        style={{ fontSize: size * 0.45 }}
      >
        {cost}
      </span>
    </span>
  );
}
