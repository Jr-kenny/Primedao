import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  iconOnly?: boolean;
};

export const BrandLogo = ({ className, iconOnly = false }: BrandLogoProps) => {
  return (
    <svg
      viewBox={iconOnly ? "0 0 120 120" : "0 0 400 120"}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Prime Dao logo"
      role="img"
      className={cn("h-10 w-auto", className)}
    >
      <path d="M40 80C40 57.9086 57.9086 40 80 40H90V80H40Z" fill="currentColor" />
      <path
        d="M60 90C60 78.9543 68.9543 70 80 70H110V90C110 101.046 101.046 110 90 110H60V90Z"
        fill="currentColor"
        opacity="0.8"
      />

      {!iconOnly && (
        <>
          <text
            x="130"
            y="75"
            fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="38"
            fill="currentColor"
          >
            PRIME
          </text>
          <text
            x="130"
            y="105"
            fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
            fontWeight="300"
            fontSize="28"
            letterSpacing="0.15em"
            fill="currentColor"
          >
            DAO
          </text>
        </>
      )}
    </svg>
  );
};
