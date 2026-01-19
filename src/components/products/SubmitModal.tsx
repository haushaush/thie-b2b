import { Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export function SubmitModal({ isOpen, onClose, onConfirm, isSubmitting }: SubmitModalProps) {
  const { items, totalDevices, totalAmount } = useCart();
  const { t, formatCurrency } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.submit.title}</DialogTitle>
          <DialogDescription>
            {t.submit.description}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-3 overflow-y-auto py-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
            >
              <div className="flex-1">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.product.storage} | Grade {item.product.grade}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.quantity}x</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(item.product.pricePerUnit)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t.submit.quantity}</span>
            <span className="font-medium">{totalDevices}</span>
          </div>
          <div className="mt-2 flex justify-between text-lg font-bold">
            <span>{t.submit.total}</span>
            <span className="text-primary">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t.submit.cancel}
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.common.loading}
              </>
            ) : (
              t.submit.confirm
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
