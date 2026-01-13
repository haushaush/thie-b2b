import { Plus, Minus } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  
  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    addItem(product, 1);
  };

  const handleRemove = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else {
      removeItem(product.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-card-foreground">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.manufacturer} | {product.storage} | {product.grade}-Grade
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cost per Unit: <span className="font-semibold text-card-foreground">{formatPrice(product.pricePerUnit)}</span>
          </p>
        </div>

        {/* Right: Stats & Actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Stats Boxes */}
          <div className="flex gap-2">
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/5">
                <span className="text-base font-bold text-primary">{product.availableUnits}</span>
              </div>
              <span className="mt-0.5 text-[10px] text-muted-foreground">Available</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-base font-bold">{product.securedUnits}</span>
              </div>
              <span className="mt-0.5 text-[10px] text-muted-foreground">Secured</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => addItem(product, product.availableUnits)}
              size="sm"
              variant="outline"
              className="h-8 px-2 border-border/50 bg-background text-xs"
              disabled={product.availableUnits === 0}
            >
              Alle
            </Button>

            {quantity === 0 ? (
              <Button
                onClick={handleAdd}
                size="sm"
                className="h-8 w-10 rounded-lg bg-accent p-0 text-accent-foreground hover:bg-accent/90"
                disabled={product.availableUnits === 0}
              >
                <Plus className="h-5 w-5" />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  onClick={handleRemove}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 rounded-lg p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                <Button
                  onClick={handleAdd}
                  size="sm"
                  className="h-8 w-10 rounded-lg bg-accent p-0 text-accent-foreground hover:bg-accent/90"
                  disabled={quantity >= product.availableUnits}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
