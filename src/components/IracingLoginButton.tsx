import Link from "next/link";

type Props = {
  href?: string;
};

export default function IracingLoginButton({ href = "/api/auth/login" }: Props) {
  return (
    <Link
      href={href}
      className="ir-btn"
      aria-label="Continue with iRacing"
    >
      <span className="ir-btn__text">CONTINUE WITH</span>
      <span className="ir-btn__logo" aria-hidden="true">
        {/* Simple stylized flag + wordmark (placeholder). Swap for a real SVG later if you want. */}
        <span className="ir-flag" />
        <span className="ir-word">iRacing</span>
      </span>
    </Link>
  );
}
