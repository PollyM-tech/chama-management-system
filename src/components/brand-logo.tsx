import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE, BRAND_LOGO_SRC } from "../../shared/brand";

export function BrandLogo({
  href = "/",
  size = "compact",
}: {
  href?: string;
  size?: "compact" | "large" | "navigation" | "header";
}) {
  const widths = {
    navigation: "w-28 sm:w-32",
    large: "w-64",
    header: "w-32",
    compact: "w-44",
  };
  return (
    <Link
      href={href}
      aria-label={`${BRAND_NAME} home`}
      className={`${size === "navigation" ? "landing-brand " : ""}block ${widths[size]} max-w-full shrink-0 bg-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700`}
    >
      <Image
        src={BRAND_LOGO_SRC}
        alt={`${BRAND_NAME} — ${BRAND_TAGLINE}`}
        width={1165}
        height={930}
        className="block h-auto w-full"
        sizes={size === "large" ? "256px" : size === "compact" ? "176px" : "128px"}
        loading="eager"
      />
    </Link>
  );
}
