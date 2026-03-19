import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <DialogTitle className="text-center">Profil unvollständig</DialogTitle>
          <DialogDescription className="text-center">
            Um Bestellungen tätigen zu können, müssen Sie zunächst Ihr Profil vervollständigen.
            Bitte ergänzen Sie Ihre Unternehmensdaten, Adressen und Nachweise.
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
            Profil vervollständigen
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Später
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
