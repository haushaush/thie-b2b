import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ProductData } from "./ProductEditModal";

interface BulkEditModalProps {
  products: ProductData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

interface EditableRow {
  id: string;
  name: string;
  manufacturer: string;
  storage: string;
  grade: string;
  price_per_unit: number;
  available_units: number;
  changed: boolean;
}

export function BulkEditModal({ products, open, onOpenChange, onSaved }: BulkEditModalProps) {
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { t, formatCurrency } = useLanguage();
  const { toast } = useToast();
  const bulk = (t as any).admin?.bulkEdit || {};

  useEffect(() => {
    if (open && products.length > 0) {
      setRows(products.map(p => ({
        id: p.id,
        name: p.name,
        manufacturer: p.manufacturer,
        storage: p.storage,
        grade: p.grade,
        price_per_unit: p.price_per_unit,
        available_units: p.available_units,
        changed: false,
      })));
    }
  }, [open, products]);

  const updateRow = (id: string, field: "price_per_unit" | "available_units", value: number) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const original = products.find(p => p.id === id);
      const updated = { ...r, [field]: value };
      updated.changed = original
        ? updated.price_per_unit !== original.price_per_unit || updated.available_units !== original.available_units
        : true;
      return updated;
    }));
  };

  const changedRows = rows.filter(r => r.changed);

  const handleSave = async () => {
    if (changedRows.length === 0) return;
    setIsSaving(true);
    try {
      const promises = changedRows.map(r =>
        supabase.from("products").update({
          price_per_unit: r.price_per_unit,
          available_units: r.available_units,
        }).eq("id", r.id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw new Error(errors[0].error!.message);

      toast({
        title: bulk.success || "Products updated",
        description: (bulk.successDesc || "{count} products updated successfully.").replace("{count}", String(changedRows.length)),
      });
      onOpenChange(false);
      onSaved();
    } catch (error: any) {
      toast({ variant: "destructive", title: bulk.error || "Error", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{bulk.title || "Bulk Edit Products"}</DialogTitle>
          <DialogDescription>
            {(bulk.description || "Edit price and quantity for {count} selected products.").replace("{count}", String(products.length))}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.admin.products.table.name}</TableHead>
                <TableHead>{t.admin.products.table.storage}</TableHead>
                <TableHead>{t.admin.products.table.grade}</TableHead>
                <TableHead className="w-[130px]">{t.admin.products.table.price}</TableHead>
                <TableHead className="w-[110px]">{t.admin.products.table.available}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id} className={row.changed ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium text-xs">
                    {row.manufacturer} {row.name}
                  </TableCell>
                  <TableCell className="text-xs">{row.storage || "-"}</TableCell>
                  <TableCell className="text-xs">{row.grade}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.price_per_unit}
                      onChange={e => updateRow(row.id, "price_per_unit", parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={row.available_units}
                      onChange={e => updateRow(row.id, "available_units", parseInt(e.target.value, 10) || 0)}
                      className="h-8 text-xs"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {changedRows.length > 0
              ? (bulk.changed || "{count} changed").replace("{count}", String(changedRows.length))
              : (bulk.noChanges || "No changes")}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || changedRows.length === 0}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? (bulk.saving || "Saving...") : (bulk.save || "Save Changes")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
