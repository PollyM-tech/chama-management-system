import Image from "next/image";
import Link from "next/link";
import logo from "@/app/logo.png";
import { BRAND_NAME, BRAND_TAGLINE } from "../../shared/brand";

export function BrandLogo({
  href = "/",
  size = "compact",
}: {
  href?: string;
  size?: "compact" | "large" | "navigation";
}) {
  if (size === "navigation") {
    return (
      <Link
        href={href}
        aria-label={`${BRAND_NAME} home`}
        className="landing-brand"
      >
        <span className="landing-brand-mark" aria-hidden="true">
          <Image
            src={logo}
            alt=""
            sizes="80px"
            className="landing-brand-mark-image"
          />
        </span>
        <span>
          Smart<span className="landing-brand-accent">Chama</span>
        </span>
      </Link>
    );
  }
  // The supplied artwork has white padding. Frame it with CSS so the complete
  // mark, wordmark and tagline remain readable without changing the source file.
  return (
    <Link
      href={href}
      aria-label={`${BRAND_NAME} home`}
      className={`relative block shrink-0 overflow-hidden rounded bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 ${size === "large" ? "h-36 w-64" : "h-28 w-48"}`}
    >
      <Image
        src={logo}
        alt={`${BRAND_NAME} — ${BRAND_TAGLINE}`}
        className={`absolute left-0 h-auto w-full ${size === "large" ? "-top-8" : "-top-6"}`}
        sizes={size === "large" ? "256px" : "192px"}
        loading="eager"
      />
    </Link>
  );
}
