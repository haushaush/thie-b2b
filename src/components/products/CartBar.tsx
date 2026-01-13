import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

interface CartBarProps {
  onSubmit: () => void;
}

export function CartBar({ onSubmit }: CartBarProps) {
  const { totalDevices, totalAmount, clearCart } = useCart();

  if (totalDevices === 0) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              Amount: <strong className="text-foreground">{totalDevices} Devices</strong>
            </span>
            <span className="text-lg font-bold text-primary">
              Total: {formatPrice(totalAmount)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={clearCart} 
            size="lg" 
            variant="outline"
            className="px-4"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Leeren
          </Button>
          <Button onClick={onSubmit} size="lg" className="px-6">
            Submit request
          </Button>
        </div>
      </div>
    </div>
  );
}
