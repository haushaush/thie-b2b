import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Minus, Trash2, Search, PackagePlus } from "lucide-react";
import type { Request, RequestItem } from "@/hooks/useRequests";

interface EditRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Request;
}

interface EditableItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  storage?: string | null;
  color?: string | null;
  grade?: string | null;
  battery_health?: number | null;
  maxAvailable: number; // current available + already reserved qty
  isNew?: boolean;
}

export function EditRequestModal({ open, onOpenChange, request }: EditRequestModalProps) {
  const { t, formatCurrency } = useLanguage();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<EditableItem[]>([]);
  const [showAddProducts, setShowAddProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Fetch available products for adding new items
  const { data: availableProducts = [] } = useQuery({
    queryKey: ["products-for-edit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: open && showAddProducts,
  });

  // Initialize items from request
  useEffect(() => {
    if (open && request) {
      setItems(
        request.items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price_per_unit: item.price_per_unit,
          storage: item.storage,
          color: item.color,
          grade: item.grade,
          battery_health: item.battery_health,
          maxAvailable: item.quantity + 999, // Will be refined when products load
          isNew: false,
        }))
      );
      setShowAddProducts(false);
      setProductSearch("");
    }
  }, [open, request]);

  // Update maxAvailable when products data loads
  useEffect(() => {
    if (availableProducts.length > 0) {
      setItems((prev) =>
        prev.map((item) => {
          const product = availableProducts.find((p) => p.id === item.product_id);
          if (product) {
            const originalQty = request.items.find((ri) => ri.product_id === item.product_id)?.quantity || 0;
            return {
              ...item,
              maxAvailable: product.available_units + originalQty,
            };
          }
          return item;
        })
      );
    }
  }, [availableProducts, request.items]);

  const mutation = useMutation({
    mutationFn: async () => {
      const itemsPayload = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        product_name: item.product_name,
      }));

      const { error } = await supabase.rpc("edit_request_items", {
        p_request_id: request.id,
        p_items: itemsPayload as any,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anfrage aktualisiert");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error editing request:", error);
      toast.error(error.message || "Fehler beim Bearbeiten der Anfrage");
    },
  });

  const updateQuantity = (productId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const newQty = Math.max(1, Math.min(item.maxAvailable, item.quantity + delta));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const setQuantity = (productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const newQty = Math.max(1, Math.min(item.maxAvailable, qty));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const addProduct = (product: any) => {
    // Check if product already in list
    if (items.some((i) => i.product_id === product.id)) {
      toast.error("Produkt bereits in der Anfrage");
      return;
    }

    if (product.available_units <= 0) {
      toast.error("Keine Einheiten verfügbar");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        price_per_unit: Number(product.price_per_unit),
        storage: product.storage,
        color: product.color,
        grade: product.grade,
        battery_health: product.battery_health,
        maxAvailable: product.available_units,
        isNew: true,
      },
    ]);
    setShowAddProducts(false);
    setProductSearch("");
  };

  const filteredProducts = useMemo(() => {
    const existingIds = new Set(items.map((i) => i.product_id));
    const q = productSearch.toLowerCase();
    return availableProducts
      .filter((p) => !existingIds.has(p.id) && p.available_units > 0)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.manufacturer.toLowerCase().includes(q) ||
          (p.storage || "").toLowerCase().includes(q)
      );
  }, [availableProducts, items, productSearch]);

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price_per_unit, 0);

  // Calculate shipping
  let shippingCost = totalQty >= 50 ? 0 : 20;
  if (request.express_shipping) {
    shippingCost += 50 + subtotal * 0.01;
  }
  const grandTotal = subtotal + shippingCost;

  const hasChanges = useMemo(() => {
    if (items.length !== request.items.length) return true;
    return items.some((item) => {
      const original = request.items.find((ri) => ri.product_id === item.product_id);
      if (!original) return true;
      return original.quantity !== item.quantity;
    });
  }, [items, request.items]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Anfrage bearbeiten</DialogTitle>
          <DialogDescription>
            Bestellung #{request.id.slice(0, 8).toUpperCase()} – Stückzahlen anpassen, Positionen entfernen oder neue Produkte hinzufügen.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-2">
            {/* Current Items */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Produkt</TableHead>
                    <TableHead className="font-semibold text-center w-[160px]">Menge</TableHead>
                    <TableHead className="font-semibold text-right">Preis</TableHead>
                    <TableHead className="font-semibold text-right">Gesamt</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Keine Produkte in der Anfrage
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const specs = [
                        item.storage,
                        item.color,
                        item.grade ? `Grade ${item.grade}` : null,
                        item.battery_health ? `${item.battery_health}%` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ");

                      return (
                        <TableRow key={item.product_id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {item.product_name}
                                {item.isNew && (
                                  <Badge variant="secondary" className="ml-2 text-[10px] py-0">Neu</Badge>
                                )}
                              </span>
                              {specs && (
                                <span className="text-xs text-muted-foreground">{specs}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.product_id, -1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => setQuantity(item.product_id, parseInt(e.target.value) || 1)}
                                className="h-7 w-14 text-center text-sm px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min={1}
                                max={item.maxAvailable}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.product_id, 1)}
                                disabled={item.quantity >= item.maxAvailable}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatCurrency(item.price_per_unit)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatCurrency(item.quantity * item.price_per_unit)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.product_id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Add Product Button / Panel */}
            {!showAddProducts ? (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowAddProducts(true)}
              >
                <PackagePlus className="h-4 w-4" />
                Produkt hinzufügen
              </Button>
            ) : (
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Produkt hinzufügen</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddProducts(false)}>
                    Schließen
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Produkte suchen..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-1">
                    {filteredProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Keine verfügbaren Produkte gefunden
                      </p>
                    ) : (
                      filteredProducts.slice(0, 20).map((product) => {
                        const specs = [
                          product.storage,
                          product.color,
                          product.grade ? `Grade ${product.grade}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ");

                        return (
                          <button
                            key={product.id}
                            className="flex items-center justify-between w-full rounded-md px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                            onClick={() => addProduct(product)}
                          >
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              {specs && (
                                <p className="text-xs text-muted-foreground">{specs}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="text-sm font-medium">{formatCurrency(Number(product.price_per_unit))}</p>
                              <p className="text-xs text-muted-foreground">{product.available_units} verfügbar</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Zwischensumme ({totalQty} Geräte)</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {request.express_shipping ? "Express-Versand" : "Versand"}
                </span>
                <span className="font-medium">
                  {shippingCost === 0 ? "Kostenlos" : formatCurrency(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Gesamtbetrag</span>
                <span className="text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Abbrechen
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || items.length === 0 || !hasChanges}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              "Änderungen speichern"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
