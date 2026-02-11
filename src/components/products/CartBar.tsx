import { useState } from "react";
import { ShoppingCart, Trash2, ChevronUp, ChevronDown, X, Minus, Plus } from "lucide-react";
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
  const { items, totalDevices, totalAmount, clearCart, removeItem, updateQuantity } = useCart();
  const { t, formatCurrency } = useLanguage();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (totalDevices === 0) return null;

  const shippingCost = totalDevices >= 50 ? 0 : 20;

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    setExpanded(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        {/* Expanded Cart Items */}
        {expanded && (
          <div className="border-b bg-card">
            <div className="container max-h-64 overflow-y-auto py-3 space-y-2">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.product.storage} | Grade {item.product.grade} | {formatCurrency(item.product.pricePerUnit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.availableUnits}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-bold w-20 text-right">
                    {formatCurrency(item.quantity * item.product.pricePerUnit)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(item.product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="container flex items-center justify-between gap-4 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 relative">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {items.length}
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{totalDevices}</strong> {totalDevices === 1 ? "Device" : "Devices"}
              </span>
              <span className="text-lg font-bold text-primary">
                {t.cart.total}: {formatCurrency(totalAmount)}
              </span>
              <span className="text-xs text-muted-foreground">
                {shippingCost === 0
                  ? t.cart.freeShipping || "Kostenloser Versand"
                  : `${t.cart.shipping || "Versand"}: ${formatCurrency(shippingCost)}`}
              </span>
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

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
