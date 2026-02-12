import { useState, useMemo } from "react";
import { Loader2, Building2, Truck, Zap, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  onConfirm: (expressShipping: boolean, shippingCost: number) => Promise<void>;
  isSubmitting: boolean;
}

const STANDARD_SHIPPING_COST = 20;
const EXPRESS_FLAT_COST = 50;
const FREE_SHIPPING_THRESHOLD = 50;

export function SubmitModal({ isOpen, onClose, onConfirm, isSubmitting }: SubmitModalProps) {
  const { items, totalDevices, totalAmount } = useCart();
  const { user } = useAuth();
  const { t, formatCurrency } = useLanguage();
  const [expressShipping, setExpressShipping] = useState(false);

  const shippingDetails = useMemo(() => {
    const isFreeShipping = totalDevices >= FREE_SHIPPING_THRESHOLD;
    const standardCost = isFreeShipping ? 0 : STANDARD_SHIPPING_COST;
    const expressCost = EXPRESS_FLAT_COST;
    const selectedShippingCost = expressShipping ? expressCost : standardCost;
    const grandTotal = totalAmount + selectedShippingCost;

    return {
      isFreeShipping,
      standardCost,
      expressCost,
      selectedShippingCost,
      grandTotal,
    };
  }, [totalDevices, totalAmount, expressShipping]);

  const handleConfirm = () => {
    onConfirm(expressShipping, shippingDetails.selectedShippingCost);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.submit.title}</DialogTitle>
          <DialogDescription>
            {t.submit.description}
          </DialogDescription>
          {user?.companyName && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user.companyName}</span>
            </div>
          )}
        </DialogHeader>

        <div className="max-h-48 space-y-3 overflow-y-auto py-4">
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

        {/* Shipping Options */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Truck className="h-4 w-4" />
            {t.shipping.title}
          </div>

          {/* Standard Shipping Button */}
          <button
            type="button"
            onClick={() => setExpressShipping(false)}
            className={`w-full rounded-lg p-3 border text-left transition-colors ${
              !expressShipping
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                !expressShipping ? "border-primary" : "border-muted-foreground"
              }`}>
                {!expressShipping && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {shippingDetails.isFreeShipping ? t.shipping.freeShipping : t.shipping.standardShipping}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.shipping.freeShippingDesc}
                </p>
              </div>
              <span className="font-bold text-sm">
                {shippingDetails.isFreeShipping ? formatCurrency(0) : formatCurrency(STANDARD_SHIPPING_COST)}
              </span>
            </div>
          </button>

          {/* Express Shipping Button */}
          <button
            type="button"
            onClick={() => setExpressShipping(true)}
            className={`w-full rounded-lg p-3 border text-left transition-colors ${
              expressShipping
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                expressShipping ? "border-primary" : "border-muted-foreground"
              }`}>
                {expressShipping && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <Zap className="h-4 w-4 text-warning" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t.shipping.expressShipping}</p>
                <p className="text-xs text-muted-foreground">
                  {t.shipping.expressShippingDesc}
                </p>
              </div>
              <span className="font-bold text-sm">
                {formatCurrency(EXPRESS_FLAT_COST)}
              </span>
            </div>
          </button>
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t.submit.quantity}</span>
            <span className="font-medium">{totalDevices}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t.submit.subtotal}</span>
            <span className="font-medium">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t.shipping.shippingCost}</span>
            <span className="font-medium">
              {expressShipping 
                ? formatCurrency(EXPRESS_FLAT_COST)
                : (shippingDetails.isFreeShipping ? t.shipping.freeShipping : formatCurrency(STANDARD_SHIPPING_COST))
              }
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>{t.shipping.grandTotal}</span>
            <span className="text-primary">{formatCurrency(shippingDetails.grandTotal)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t.submit.cancel}
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
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
