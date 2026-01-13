import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface RequestActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  action: "approve" | "reject";
}

export function RequestActionModal({
  open,
  onOpenChange,
  requestId,
  action,
}: RequestActionModalProps) {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("requests")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          admin_message: message.trim() || null,
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        action === "approve"
          ? "Anfrage wurde genehmigt"
          : "Anfrage wurde abgelehnt"
      );
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      onOpenChange(false);
      setMessage("");
    },
    onError: (error) => {
      console.error("Error updating request:", error);
      toast.error("Fehler beim Aktualisieren der Anfrage");
    },
  });

  const handleSubmit = () => {
    mutation.mutate();
  };

  const isApprove = action === "approve";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            {isApprove ? "Anfrage genehmigen" : "Anfrage ablehnen"}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? "Bestätigen Sie die Genehmigung dieser Anfrage."
              : "Bestätigen Sie die Ablehnung dieser Anfrage."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Nachricht an den Anfragenden (optional)</Label>
            <Textarea
              id="message"
              placeholder="Fügen Sie eine optionale Nachricht hinzu..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Abbrechen
          </Button>
          <Button
            variant={isApprove ? "default" : "destructive"}
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird verarbeitet...
              </>
            ) : isApprove ? (
              "Genehmigen"
            ) : (
              "Ablehnen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
