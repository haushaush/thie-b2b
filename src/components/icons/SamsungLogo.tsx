import samsungLogo from "@/assets/samsung-logo.jpg";

export function SamsungLogo({ className }: { className?: string }) {
  return (
    <img
      src={samsungLogo}
      alt="Samsung"
      className={className}
    />
  );
}
