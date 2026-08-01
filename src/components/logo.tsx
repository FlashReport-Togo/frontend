import Image from "next/image";

export function Logo({ size = 40 }: { size?: number }) {
  // Le fichier public/logo.svg est un placeholder : à remplacer par le logo officiel
  // (déjà conçu pour respecter la palette light/dark).
  return (
    <Image
      src="/logo.svg"
      alt="FlashReport"
      width={size}
      height={size}
      priority
      className="shrink-0"
    />
  );
}
