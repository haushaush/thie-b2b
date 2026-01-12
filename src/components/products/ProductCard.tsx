import { Plus, Minus } from "lucide-react";
import { Product } from "@/data/mockProducts";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Product Info */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-card-foreground">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {product.manufacturer} | {product.storage} | Grade {product.grade}
        </p>
      </div>

      {/* Price */}
      <div className="mb-3">
        <span className="text-lg font-bold text-primary">
          {formatPrice(product.pricePerUnit)}
        </span>
        <span className="text-sm text-muted-foreground"> / Stk.</span>
      </div>

      {/* Badges */}
      <div className="mb-4 flex gap-2">
        <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
          {product.availableUnits} Available
        </Badge>
        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
          {product.securedUnits} Secured
        </Badge>
      </div>

      {/* Action Area */}
      <div className="flex items-center justify-between gap-3">
        <Select defaultValue="all">
          <SelectTrigger className="h-9 w-24 text-sm">
            <SelectValue placeholder="Alle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="a">Grade A</SelectItem>
            <SelectItem value="b">Grade B</SelectItem>
          </SelectContent>
        </Select>

        {quantity === 0 ? (
          <Button
            onClick={handleAdd}
            size="sm"
            className="h-9 w-9 rounded-full bg-accent p-0 text-accent-foreground hover:bg-accent/90"
            disabled={product.availableUnits === 0}
          >
            <Plus className="h-5 w-5" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRemove}
              size="sm"
              variant="outline"
              className="h-8 w-8 rounded-full p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button
              onClick={handleAdd}
              size="sm"
              className="h-8 w-8 rounded-full bg-accent p-0 text-accent-foreground hover:bg-accent/90"
              disabled={quantity >= product.availableUnits}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
