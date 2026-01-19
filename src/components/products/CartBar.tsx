import { useState } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CartBarProps {
  onSubmit: () => void;
}

export function CartBar({ onSubmit }: CartBarProps) {
  const { totalDevices, totalAmount, clearCart } = useCart();
  const { t, formatCurrency } = useLanguage();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (totalDevices === 0) return null;

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{totalDevices}</strong> {totalDevices === 1 ? "Device" : "Devices"}
              </span>
              <span className="text-lg font-bold text-primary">
                {t.cart.total}: {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowClearConfirm(true)} 
              size="lg" 
              variant="outline"
              className="px-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t.common.clear}
            </Button>
            <Button onClick={onSubmit} size="lg" className="px-6">
              {t.cart.submitRequest}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.clear} {t.cart.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t.cart.emptyDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCart}>
              {t.common.yes}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
