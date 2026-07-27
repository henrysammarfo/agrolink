import { Link } from "@tanstack/react-router";
import { Mail, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrandLogo } from "@/components/brand/Logo";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
};

export function AuthGateModal({ open, onOpenChange, reason }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[420px] gap-0 overflow-hidden border-white/10 bg-[#121212] p-0 text-white shadow-2xl sm:rounded-2xl [&>button]:text-white/70 [&>button]:hover:text-white"
        aria-describedby={undefined}
      >
        <DialogHeader className="space-y-1 border-b border-white/10 px-6 pb-4 pt-6 text-left">
          <div className="mb-3">
            <BrandLogo size="sm" asLink={false} className="[&_span]:!text-white" />
          </div>
          <DialogTitle className="font-sans text-2xl font-bold tracking-tight text-white">
            Log in to AgroLink
          </DialogTitle>
          <DialogDescription className="text-sm text-white/55">
            {reason?.trim()
              ? reason
              : "Swipe free. Sign in to like, save, comment, or add to cart."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-6 py-5">
          <Link
            to="/auth"
            onClick={() => onOpenChange(false)}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Mail className="h-4 w-4" />
            Use email or Google
          </Link>
          <Link
            to="/auth"
            onClick={() => onOpenChange(false)}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            <UserRound className="h-4 w-4" />
            Continue to sign in
          </Link>
        </div>

        <p className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/45">
          By continuing you agree to our Terms. Based in Ghana.
        </p>
        <p className="border-t border-white/10 bg-black/40 px-6 py-4 text-center text-sm text-white/70">
          Don&apos;t have an account?{" "}
          <Link
            to="/auth"
            onClick={() => onOpenChange(false)}
            className="font-semibold text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
