import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProfileIncompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileIncompleteModal({ open, onOpenChange }: ProfileIncompleteModalProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <DialogTitle className="text-center">{(t as any).profileIncomplete?.title || "Profile Incomplete"}</DialogTitle>
          <DialogDescription className="text-center">
            {(t as any).profileIncomplete?.description || "To place orders, you must first complete your profile."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate("/complete-profile");
            }}
          >
            {(t as any).profileIncomplete?.completeProfile || "Complete Profile"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {(t as any).profileIncomplete?.later || "Later"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
