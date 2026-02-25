import samsungLogo from "@/assets/samsung-logo.webp";

export function SamsungLogo({ className }: { className?: string }) {
  return (
    <img
      src={samsungLogo}
      alt="Samsung"
      className={className}
    />
  );
}
