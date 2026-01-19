import { useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name may have max. 200 characters"),
  manufacturer: z.string().trim().min(1, "Manufacturer is required").max(100, "Manufacturer may have max. 100 characters"),
  storage: z.string().trim().max(50, "Storage may have max. 50 characters").optional(),
  grade: z.enum(["A", "B", "C"], { required_error: "Grade is required" }),
  price_per_unit: z.number().min(0, "Price must be positive"),
  available_units: z.number().int().min(0, "Units must be positive"),
});

export type NewProductData = z.infer<typeof productSchema>;

interface ProductAddModalProps { open: boolean; onOpenChange: (open: boolean) => void; onSave: (product: NewProductData) => Promise<void>; isSaving: boolean; }

const emptyProduct: NewProductData = { name: "", manufacturer: "", storage: "", grade: "A", price_per_unit: 0, available_units: 0 };

export function ProductAddModal({ open, onOpenChange, onSave, isSaving }: ProductAddModalProps) {
  const [formData, setFormData] = useState<NewProductData>(emptyProduct);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenChange = (isOpen: boolean) => { if (!isOpen) { setFormData(emptyProduct); setErrors({}); } onOpenChange(isOpen); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = productSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    await onSave(result.data);
    setFormData(emptyProduct);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add New Product</DialogTitle><DialogDescription>Enter the product details and save.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="add-name">Name</Label><Input id="add-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. iPhone 15 Pro" />{errors.name && <p className="text-sm text-destructive">{errors.name}</p>}</div>
          <div className="space-y-2"><Label htmlFor="add-manufacturer">Manufacturer</Label><Input id="add-manufacturer" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} placeholder="e.g. Apple" />{errors.manufacturer && <p className="text-sm text-destructive">{errors.manufacturer}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="add-storage">Storage</Label><Input id="add-storage" value={formData.storage} onChange={(e) => setFormData({ ...formData, storage: e.target.value })} placeholder="e.g. 256GB" />{errors.storage && <p className="text-sm text-destructive">{errors.storage}</p>}</div>
            <div className="space-y-2"><Label htmlFor="add-grade">Grade</Label><Select value={formData.grade} onValueChange={(value: "A" | "B" | "C") => setFormData({ ...formData, grade: value })}><SelectTrigger id="add-grade"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent></Select>{errors.grade && <p className="text-sm text-destructive">{errors.grade}</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="add-price">Price per Unit (€)</Label><Input id="add-price" type="number" min="0" step="0.01" value={formData.price_per_unit} onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) || 0 })} />{errors.price_per_unit && <p className="text-sm text-destructive">{errors.price_per_unit}</p>}</div>
            <div className="space-y-2"><Label htmlFor="add-units">Available Units</Label><Input id="add-units" type="number" min="0" value={formData.available_units} onChange={(e) => setFormData({ ...formData, available_units: parseInt(e.target.value, 10) || 0 })} />{errors.available_units && <p className="text-sm text-destructive">{errors.available_units}</p>}</div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
