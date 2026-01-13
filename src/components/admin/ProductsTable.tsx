import { useState } from "react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { ProductEditModal, ProductData } from "./ProductEditModal";

interface ProductsTableProps {
  products: ProductData[];
  isLoading: boolean;
  onProductUpdated: () => void;
}

export function ProductsTable({ products, isLoading, onProductUpdated }: ProductsTableProps) {
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleSave = async (product: ProductData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: product.name,
          manufacturer: product.manufacturer,
          storage: product.storage,
          grade: product.grade,
          price_per_unit: product.price_per_unit,
          available_units: product.available_units,
        })
        .eq("id", product.id);

      if (error) throw error;

      toast({
        title: "Produkt aktualisiert",
        description: `${product.name} wurde erfolgreich gespeichert.`,
      });

      setEditingProduct(null);
      onProductUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Speichern",
        description: error.message || "Ein Fehler ist aufgetreten",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", deletingProduct.id);

      if (error) throw error;

      toast({
        title: "Produkt gelöscht",
        description: `${deletingProduct.name} wurde entfernt.`,
      });

      setDeletingProduct(null);
      onProductUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Löschen",
        description: error.message || "Ein Fehler ist aufgetreten",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Keine Produkte vorhanden</p>
        <p className="text-sm text-muted-foreground">
          Laden Sie eine CSV-Datei hoch, um Produkte hinzuzufügen.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Hersteller</TableHead>
              <TableHead>Speicher</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">Preis</TableHead>
              <TableHead className="text-right">Stück</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.manufacturer}</TableCell>
                <TableCell>{product.storage || "-"}</TableCell>
                <TableCell>
                  <Badge variant={product.grade === "A" ? "default" : "secondary"}>
                    {product.grade}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {product.price_per_unit.toFixed(2)} €
                </TableCell>
                <TableCell className="text-right">{product.available_units}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingProduct(product)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <ProductEditModal
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Produkt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{deletingProduct?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
