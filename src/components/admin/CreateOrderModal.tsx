import { useState, useMemo } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomerProfile {
  user_id: string;
  email: string;
  company_name: string | null;
  contact_person: string | null;
}

interface ProductData {
  id: string;
  name: string;
  manufacturer: string;
  storage: string;
  price_per_unit: number;
  available_units: number;
  grade: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
}

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: CustomerProfile[];
  products: ProductData[];
  onCreated: () => void;
}

const STANDARD_SHIPPING_COST = 20;
const EXPRESS_BASE_COST = 50;
const EXPRESS_PERCENTAGE = 0.01;
const FREE_SHIPPING_THRESHOLD = 50;

export function CreateOrderModal({ open, onOpenChange, customers, products, onCreated }: CreateOrderModalProps) {
  const { t, formatCurrency } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [expressShipping, setExpressShipping] = useState(false);

  const addItem = () => {
    setOrderItems(prev => [...prev, { productId: "", productName: "", quantity: 1, pricePerUnit: 0 }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    setOrderItems(prev => {
      const updated = [...prev];
      if (field === "productId") {
        const product = products.find(p => p.id === value);
        if (product) {
          updated[index] = { ...updated[index], productId: value, productName: product.name, pricePerUnit: product.price_per_unit };
        }
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(() => orderItems.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0), [orderItems]);
  const totalDevices = useMemo(() => orderItems.reduce((sum, item) => sum + item.quantity, 0), [orderItems]);
  
  const shippingCost = useMemo(() => {
    if (expressShipping) return EXPRESS_BASE_COST + (totalAmount * EXPRESS_PERCENTAGE);
    return totalDevices >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
  }, [expressShipping, totalAmount, totalDevices]);

  const handleSubmit = async () => {
    if (!selectedCustomerId) {
      toast({ variant: "destructive", title: t.common.error, description: "Bitte einen Kunden auswählen." });
      return;
    }
    if (orderItems.length === 0 || orderItems.some(item => !item.productId || item.quantity < 1)) {
      toast({ variant: "destructive", title: t.common.error, description: "Bitte mindestens ein gültiges Produkt hinzufügen." });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create request
      const { data: request, error: requestError } = await supabase
        .from("requests")
        .insert({
          user_id: selectedCustomerId,
          status: "pending",
          express_shipping: expressShipping,
          shipping_cost: shippingCost,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create request items
      const items = orderItems.map(item => ({
        request_id: request.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price_per_unit: item.pricePerUnit,
      }));

      const { error: itemsError } = await supabase.from("request_items").insert(items);
      if (itemsError) throw itemsError;

      toast({ title: t.admin.orders?.createSuccess || "Bestellung erstellt", description: t.admin.orders?.createSuccessDesc || "Die Bestellung wurde erfolgreich angelegt." });
      setSelectedCustomerId("");
      setOrderItems([]);
      setExpressShipping(false);
      onOpenChange(false);
      onCreated();
    } catch (error: any) {
      toast({ variant: "destructive", title: t.common.error, description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t.admin.orders?.createTitle || "Bestellung anlegen"}
          </DialogTitle>
          <DialogDescription>
            {t.admin.orders?.createDesc || "Erstellen Sie eine Bestellung für einen Kunden."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>{t.admin.requests.customer} *</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Kunde auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.company_name || c.email} {c.contact_person ? `(${c.contact_person})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            <Label>{t.admin.actionModal.products}</Label>
            {orderItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2 rounded-lg border p-3">
                <div className="flex-1">
                  <Select value={item.productId} onValueChange={(v) => updateItem(index, "productId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Produkt wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.storage}) - {formatCurrency(p.price_per_unit)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm font-medium w-24 text-right">
                  {formatCurrency(item.quantity * item.pricePerUnit)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-destructive">
                  ×
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              + {t.admin.orders?.addProduct || "Produkt hinzufügen"}
            </Button>
          </div>

          {/* Express Shipping */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Checkbox
              id="adminExpressShipping"
              checked={expressShipping}
              onCheckedChange={(checked) => setExpressShipping(checked === true)}
            />
            <Label htmlFor="adminExpressShipping" className="cursor-pointer">
              {t.shipping.expressShipping} (+{formatCurrency(EXPRESS_BASE_COST)} + 1%)
            </Label>
          </div>

          {/* Summary */}
          {orderItems.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.submit.subtotal}</span>
                <span className="font-medium">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.shipping.shippingCost}</span>
                <span className="font-medium">{shippingCost === 0 ? t.shipping.freeShipping : formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>{t.shipping.grandTotal}</span>
                <span className="text-primary">{formatCurrency(totalAmount + shippingCost)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || orderItems.length === 0}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.common.loading}</> : (t.admin.orders?.create || "Bestellung anlegen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
