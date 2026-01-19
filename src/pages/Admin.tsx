import { useState, useRef, useMemo } from "react";
import { Upload, FileSpreadsheet, Trash2, AlertCircle, CheckCircle, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequests } from "@/hooks/useRequests";
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
  name: z.string().trim().min(1, "Name is required").max(200, "Name may have max. 200 characters"),
  manufacturer: z.string().trim().min(1, "Manufacturer is required").max(100, "Manufacturer may have max. 100 characters"),
  storage: z.string().trim().max(50, "Storage may have max. 50 characters").optional().default(""),
  color: z.string().trim().max(100, "Color may have max. 100 characters").optional().default(""),
  battery_health: z.number().int("Battery health must be an integer").min(0).max(100).optional().default(0),
  grade: z.enum(["A", "B", "C"], { errorMap: () => ({ message: "Invalid grade (allowed: A, B, C)" }) }),
  price_per_unit: z.number().positive("Price must be positive").max(999999, "Price may be max. 999,999"),
  available_units: z.number().int("Units must be an integer").min(0, "Units cannot be negative").max(999999, "Units may be max. 999,999"),
});

type CSVProduct = z.infer<typeof CSVProductSchema>;

const sanitizeText = (str: string): string => {
  return str.replace(/[\x00-\x1F\x7F]/g, "").trim();
};

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

  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data.map((p) => ({
        id: p.id, name: p.name, manufacturer: p.manufacturer, storage: p.storage || "",
        color: p.color || "", battery_health: p.battery_health || 0, grade: p.grade || "A",
        price_per_unit: Number(p.price_per_unit), available_units: p.available_units,
      })) as ProductData[];
    },
  });

  const parseCSV = (content: string): ParseResult => {
    const lines = content.trim().split("\n");
    const products: CSVProduct[] = [];
    const errors: string[] = [];

    if (lines.length < 2) {
      errors.push("CSV file must contain at least a header row and one data row");
      return { products, errors };
    }

    const header = lines[0].split(";").map((h) => h.trim().toLowerCase());
    const requiredColumns = ["name", "manufacturer", "storage", "color", "battery_health", "grade", "price_per_unit", "available_units"];
    const missingColumns = requiredColumns.filter((col) => !header.includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Missing columns: ${missingColumns.join(", ")}`);
      return { products, errors };
    }

    const columnIndices = {
      name: header.indexOf("name"), manufacturer: header.indexOf("manufacturer"),
      storage: header.indexOf("storage"), color: header.indexOf("color"),
      battery_health: header.indexOf("battery_health"), grade: header.indexOf("grade"),
      price_per_unit: header.indexOf("price_per_unit"), available_units: header.indexOf("available_units"),
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(";").map((v) => v.trim());
      try {
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

        const result = CSVProductSchema.safeParse({
          name: rawName, manufacturer: rawManufacturer, storage: rawStorage, color: rawColor,
          battery_health: isNaN(batteryHealth) ? 0 : batteryHealth, grade: rawGrade,
          price_per_unit: isNaN(price) ? -1 : price, available_units: isNaN(units) ? -1 : units,
        });

        if (!result.success) {
          const errorMessages = result.error.errors.map(e => e.message).join("; ");
          errors.push(`Row ${i + 1}: ${errorMessages}`);
          continue;
        }
        products.push(result.data);
      } catch {
        errors.push(`Row ${i + 1}: Error parsing`);
      }
    }
    return { products, errors };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast({ variant: "destructive", title: "Invalid file format", description: "Please upload a CSV file" });
      return;
    }
    if (file.size > MAX_CSV_FILE_SIZE) {
      toast({ variant: "destructive", title: "File too large", description: "CSV file may be max. 5 MB" });
      return;
    }
    const content = await file.text();
    const result = parseCSV(content);
    setParsedProducts(result.products);
    setParseErrors(result.errors);
    if (result.products.length > 0) setShowConfirmDialog(true);
    else if (result.errors.length > 0) toast({ variant: "destructive", title: "Parse error", description: "CSV file contains no valid products" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadConfirm = async () => {
    setShowConfirmDialog(false);
    setIsUploading(true);
    try {
      const { error: deleteError } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (deleteError) throw deleteError;
      const productsForInsert = parsedProducts.map(p => ({
        name: p.name, manufacturer: p.manufacturer, storage: p.storage, color: p.color,
        battery_health: p.battery_health, grade: p.grade, price_per_unit: p.price_per_unit, available_units: p.available_units,
      }));
      const { error: insertError } = await supabase.from("products").insert(productsForInsert);
      if (insertError) throw insertError;
      toast({ title: "Catalog updated successfully", description: `${parsedProducts.length} products imported` });
      setParsedProducts([]);
      setParseErrors([]);
      refetchProducts();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload error", description: error.message || "An error occurred" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast({ title: "Catalog deleted", description: "All products have been removed" });
      refetchProducts();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Delete error", description: error.message || "An error occurred" });
    } finally {
      setIsDeleting(false);
    }
  };

  const { data: requests = [] } = useRequests();
  const totalUnits = useMemo(() => products.reduce((sum, p) => sum + p.available_units, 0), [products]);
  const totalValue = useMemo(() => products.reduce((sum, p) => sum + (p.price_per_unit * p.available_units), 0), [products]);
  const requestStats = useMemo(() => {
    const pending = requests.filter(r => r.status === "pending").length;
    const approved = requests.filter(r => r.status === "approved").length;
    const rejected = requests.filter(r => r.status === "rejected").length;
    return { pending, approved, rejected, total: requests.length };
  }, [requests]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Manage the device catalog</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Product Types</CardDescription><CardTitle className="text-3xl">{products.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Units</CardDescription><CardTitle className="text-3xl">{totalUnits.toLocaleString('en-US')}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Value</CardDescription><CardTitle className="text-3xl">{totalValue.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1"><FileSpreadsheet className="h-4 w-4" />All Requests</CardDescription><CardTitle className="text-3xl">{requestStats.total}</CardTitle></CardHeader></Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1 text-yellow-600"><Clock className="h-4 w-4" />Pending</CardDescription><CardTitle className="text-3xl text-yellow-600">{requestStats.pending}</CardTitle></CardHeader></Card>
        <Card className="border-green-500/20 bg-green-500/5"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" />Approved</CardDescription><CardTitle className="text-3xl text-green-600">{requestStats.approved}</CardTitle></CardHeader></Card>
        <Card className="border-red-500/20 bg-red-500/5"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" />Rejected</CardDescription><CardTitle className="text-3xl text-red-600">{requestStats.rejected}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />CSV Import</CardTitle><CardDescription>Upload a CSV file to update the device catalog. Existing products will be replaced.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="csv-upload" />
            <label htmlFor="csv-upload" className="flex cursor-pointer flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <span className="text-lg font-medium">Upload CSV file</span>
              <span className="text-sm text-muted-foreground">Click here or drag a file here</span>
            </label>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">CSV Format</h4>
            <p className="mb-2 text-sm text-muted-foreground">The CSV file must contain the following columns (semicolon-separated):</p>
            <code className="block rounded bg-background p-2 text-xs">name;manufacturer;storage;color;battery_health;grade;price_per_unit;available_units</code>
            <p className="mt-2 text-xs text-muted-foreground">Example: iPhone 14 Pro;Apple;256GB;Space Black;89;A;899.99;50</p>
          </div>
          <div className="flex gap-3">
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting || isUploading}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Delete All Products
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Product Catalog</CardTitle><CardDescription>All {products.length} products in the system. Click Edit to modify a product.</CardDescription></CardHeader>
        <CardContent><ProductsTable products={products} isLoading={isLoadingProducts} onProductUpdated={refetchProducts} /></CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" />{parsedProducts.length} products found</AlertDialogTitle><AlertDialogDescription>Do you want to replace the current catalog with these products?</AlertDialogDescription></AlertDialogHeader>
          {parseErrors.length > 0 && (<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3"><div className="flex items-center gap-2 text-destructive"><AlertCircle className="h-4 w-4" /><span className="font-medium">{parseErrors.length} warnings</span></div><ul className="mt-2 max-h-20 overflow-y-auto text-sm text-destructive/80">{parseErrors.slice(0, 5).map((error, i) => (<li key={i}>• {error}</li>))}{parseErrors.length > 5 && (<li>... and {parseErrors.length - 5} more</li>)}</ul></div>)}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Manufacturer</TableHead><TableHead>Storage</TableHead><TableHead>Grade</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Units</TableHead></TableRow></TableHeader><TableBody>{parsedProducts.slice(0, 10).map((product, i) => (<TableRow key={i}><TableCell className="font-medium">{product.name}</TableCell><TableCell>{product.manufacturer}</TableCell><TableCell>{product.storage}</TableCell><TableCell>{product.grade}</TableCell><TableCell className="text-right">{product.price_per_unit.toFixed(2)} €</TableCell><TableCell className="text-right">{product.available_units}</TableCell></TableRow>))}{parsedProducts.length > 10 && (<TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">... and {parsedProducts.length - 10} more products</TableCell></TableRow>)}</TableBody></Table>
          </div>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleUploadConfirm} disabled={isUploading}>{isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Replace Catalog</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete all products?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. All products in the catalog will be permanently deleted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
