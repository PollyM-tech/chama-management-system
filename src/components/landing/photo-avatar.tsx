import Image from "next/image";
import { LANDING_IMAGES } from "@/lib/landing-images";

const portraits = [
  { left: "-30%", top: "-65%" },
  { left: "-150%", top: "-74%" },
  { left: "-275%", top: "-78%" },
  { left: "-420%", top: "-67%" },
];

export function PhotoAvatar({
  person = 0,
  className = "",
}: {
  person?: number;
  className?: string;
}) {
  const position = portraits[person % portraits.length];
  return (
    <span className={`landing-photo-avatar ${className}`} aria-hidden="true">
      <Image
        src={LANDING_IMAGES.hero}
        alt=""
        width={1672}
        height={941}
        sizes="256px"
        style={{
          width: "550%",
          maxWidth: "none",
          height: "auto",
          position: "absolute",
          ...position,
        }}
      />
    </span>
  );
}
