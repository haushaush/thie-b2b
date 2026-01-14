import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Trash2, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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
import { ProductsTable } from "@/components/admin/ProductsTable";
import { ProductData } from "@/components/admin/ProductEditModal";
import { z } from "zod";

// Zod schema for comprehensive CSV product validation
const CSVProductSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich").max(200, "Name darf max. 200 Zeichen haben"),
  manufacturer: z.string().trim().min(1, "Hersteller ist erforderlich").max(100, "Hersteller darf max. 100 Zeichen haben"),
  storage: z.string().trim().max(50, "Speicher darf max. 50 Zeichen haben").optional().default(""),
  color: z.string().trim().max(100, "Farbe darf max. 100 Zeichen haben").optional().default(""),
  battery_health: z.number().int("Batteriestand muss ganzzahlig sein").min(0).max(100).optional().default(0),
  grade: z.enum(["A", "B", "C"], { errorMap: () => ({ message: "Ungültige Qualitätsstufe (erlaubt: A, B, C)" }) }),
  price_per_unit: z.number().positive("Preis muss positiv sein").max(999999, "Preis darf max. 999.999 sein"),
  available_units: z.number().int("Stückzahl muss ganzzahlig sein").min(0, "Stückzahl darf nicht negativ sein").max(999999, "Stückzahl darf max. 999.999 sein"),
});

type CSVProduct = z.infer<typeof CSVProductSchema>;

// Sanitize text by removing control characters
const sanitizeText = (str: string): string => {
  return str.replace(/[\x00-\x1F\x7F]/g, "").trim();
};

// Maximum CSV file size (5MB)
const MAX_CSV_FILE_SIZE = 5 * 1024 * 1024;

interface ParseResult {
  products: CSVProduct[];
  errors: string[];
}

export default function Admin() {
  const [isUploading, setIsUploading] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<CSVProduct[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch all products
  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;

      return data.map((p) => ({
        id: p.id,
        name: p.name,
        manufacturer: p.manufacturer,
        storage: p.storage || "",
        color: p.color || "",
        battery_health: p.battery_health || 0,
        grade: p.grade || "A",
        price_per_unit: Number(p.price_per_unit),
        available_units: p.available_units,
      })) as ProductData[];
    },
  });

  const parseCSV = (content: string): ParseResult => {
    const lines = content.trim().split("\n");
    const products: CSVProduct[] = [];
    const errors: string[] = [];

    if (lines.length < 2) {
      errors.push("Die CSV-Datei muss mindestens eine Kopfzeile und eine Datenzeile enthalten");
      return { products, errors };
    }

    // Parse header
    const header = lines[0].split(";").map((h) => h.trim().toLowerCase());
    const requiredColumns = ["name", "manufacturer", "storage", "color", "battery_health", "grade", "price_per_unit", "available_units"];
    
    const missingColumns = requiredColumns.filter((col) => !header.includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Fehlende Spalten: ${missingColumns.join(", ")}`);
      return { products, errors };
    }

    const columnIndices = {
      name: header.indexOf("name"),
      manufacturer: header.indexOf("manufacturer"),
      storage: header.indexOf("storage"),
      color: header.indexOf("color"),
      battery_health: header.indexOf("battery_health"),
      grade: header.indexOf("grade"),
      price_per_unit: header.indexOf("price_per_unit"),
      available_units: header.indexOf("available_units"),
    };

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(";").map((v) => v.trim());
      
      try {
        // Sanitize text fields to remove control characters
        const rawName = sanitizeText(values[columnIndices.name] || "");
        const rawManufacturer = sanitizeText(values[columnIndices.manufacturer] || "");
        const rawStorage = sanitizeText(values[columnIndices.storage] || "");
        const rawColor = sanitizeText(values[columnIndices.color] || "");
        const rawBatteryHealth = values[columnIndices.battery_health]?.replace("%", "");
        const rawGrade = sanitizeText(values[columnIndices.grade] || "").toUpperCase();
        const priceStr = values[columnIndices.price_per_unit]?.replace(",", ".");
        const unitsStr = values[columnIndices.available_units];

        const price = parseFloat(priceStr);
        const units = parseInt(unitsStr, 10);
        const batteryHealth = parseInt(rawBatteryHealth, 10);

        // Validate with Zod schema
        const result = CSVProductSchema.safeParse({
          name: rawName,
          manufacturer: rawManufacturer,
          storage: rawStorage,
          color: rawColor,
          battery_health: isNaN(batteryHealth) ? 0 : batteryHealth,
          grade: rawGrade,
          price_per_unit: isNaN(price) ? -1 : price,
          available_units: isNaN(units) ? -1 : units,
        });

        if (!result.success) {
          const errorMessages = result.error.errors.map(e => e.message).join("; ");
          errors.push(`Zeile ${i + 1}: ${errorMessages}`);
          continue;
        }

        products.push(result.data);
      } catch {
        errors.push(`Zeile ${i + 1}: Fehler beim Parsen`);
      }
    }

    return { products, errors };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Ungültiges Dateiformat",
        description: "Bitte laden Sie eine CSV-Datei hoch",
      });
      return;
    }

    // Check file size limit (5MB)
    if (file.size > MAX_CSV_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "Datei zu groß",
        description: "Die CSV-Datei darf maximal 5 MB groß sein",
      });
      return;
    }

    const content = await file.text();
    const result = parseCSV(content);
    
    setParsedProducts(result.products);
    setParseErrors(result.errors);

    if (result.products.length > 0) {
      setShowConfirmDialog(true);
    } else if (result.errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Fehler beim Parsen",
        description: "Die CSV-Datei enthält keine gültigen Produkte",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadConfirm = async () => {
    setShowConfirmDialog(false);
    setIsUploading(true);

    try {
      // First, delete all existing products
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (deleteError) throw deleteError;

      // Insert new products - map to database schema
      const productsForInsert = parsedProducts.map(p => ({
        name: p.name,
        manufacturer: p.manufacturer,
        storage: p.storage,
        color: p.color,
        battery_health: p.battery_health,
        grade: p.grade,
        price_per_unit: p.price_per_unit,
        available_units: p.available_units,
      }));

      const { error: insertError } = await supabase
        .from("products")
        .insert(productsForInsert);

      if (insertError) throw insertError;

      toast({
        title: "Katalog erfolgreich aktualisiert",
        description: `${parsedProducts.length} Produkte wurden importiert`,
      });

      setParsedProducts([]);
      setParseErrors([]);
      refetchProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Upload",
        description: error.message || "Ein Fehler ist aufgetreten",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast({
        title: "Katalog gelöscht",
        description: "Alle Produkte wurden entfernt",
      });
      refetchProducts();
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Verwalten Sie den Gerätekatalog
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSV Import
          </CardTitle>
          <CardDescription>
            Laden Sie eine CSV-Datei hoch, um den Gerätekatalog zu aktualisieren.
            Die bestehenden Produkte werden ersetzt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex cursor-pointer flex-col items-center gap-2"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <span className="text-lg font-medium">CSV-Datei hochladen</span>
              <span className="text-sm text-muted-foreground">
                Klicken Sie hier oder ziehen Sie eine Datei hierher
              </span>
            </label>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">CSV Format</h4>
            <p className="mb-2 text-sm text-muted-foreground">
              Die CSV-Datei muss folgende Spalten enthalten (Semikolon-getrennt):
            </p>
            <code className="block rounded bg-background p-2 text-xs">
              name;manufacturer;storage;color;battery_health;grade;price_per_unit;available_units
            </code>
            <p className="mt-2 text-xs text-muted-foreground">
              Beispiel: iPhone 14 Pro;Apple;256GB;Space Black;89;A;899.99;50
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting || isUploading}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Alle Produkte löschen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produktkatalog</CardTitle>
          <CardDescription>
            Alle {products.length} Produkte im System. Klicken Sie auf Bearbeiten, um ein Produkt zu ändern.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsTable
            products={products}
            isLoading={isLoadingProducts}
            onProductUpdated={refetchProducts}
          />
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {parsedProducts.length} Produkte gefunden
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den aktuellen Katalog mit diesen Produkten ersetzen?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">{parseErrors.length} Warnungen</span>
              </div>
              <ul className="mt-2 max-h-20 overflow-y-auto text-sm text-destructive/80">
                {parseErrors.slice(0, 5).map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
                {parseErrors.length > 5 && (
                  <li>... und {parseErrors.length - 5} weitere</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Hersteller</TableHead>
                  <TableHead>Speicher</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Preis</TableHead>
                  <TableHead className="text-right">Stück</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedProducts.slice(0, 10).map((product, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.manufacturer}</TableCell>
                    <TableCell>{product.storage}</TableCell>
                    <TableCell>{product.grade}</TableCell>
                    <TableCell className="text-right">
                      {product.price_per_unit.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right">{product.available_units}</TableCell>
                  </TableRow>
                ))}
                {parsedProducts.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      ... und {parsedProducts.length - 10} weitere Produkte
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleUploadConfirm} disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Katalog ersetzen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle Produkte löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Produkte im Katalog werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Alle löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
