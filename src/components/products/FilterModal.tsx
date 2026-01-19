import { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { modelOptions, storageOptions, gradeOptions } from "@/data/mockProducts";

export interface FilterState {
  models: string[];
  storage: string[];
  grades: ("A" | "B" | "C")[];
  colors: string[];
  batteryRange: [number, number];
  priceRange: [number, number];
}

interface FilterModalProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  activeFilterCount: number;
  availableColors?: string[];
}

export function FilterModal({ filters, onFiltersChange, activeFilterCount, availableColors = [] }: FilterModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleOpen = () => {
    setLocalFilters(filters);
    setIsOpen(true);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      models: [],
      storage: [],
      grades: [],
      colors: [],
      batteryRange: [0, 100],
      priceRange: [0, 2000],
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    setIsOpen(false);
  };

  const toggleArrayFilter = <T extends string>(
    key: keyof FilterState,
    value: T
  ) => {
    setLocalFilters((prev) => {
      const array = prev[key] as T[];
      if (array.includes(value)) {
        return { ...prev, [key]: array.filter((v) => v !== value) };
      }
      return { ...prev, [key]: [...array, value] };
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2" onClick={handleOpen}>
          <Filter className="h-4 w-4" />
          FILTER
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filter
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-sm">
                Reset
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto pb-20">
          {/* Models */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Model</Label>
            <div className="grid grid-cols-2 gap-2">
              {modelOptions.map((model) => (
                <label
                  key={model}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={localFilters.models.includes(model)}
                    onCheckedChange={() => toggleArrayFilter("models", model)}
                  />
                  <span className="line-clamp-1">{model}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Storage</Label>
            <div className="flex flex-wrap gap-2">
              {storageOptions.map((storage) => (
                <label
                  key={storage}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={localFilters.storage.includes(storage)}
                    onCheckedChange={() => toggleArrayFilter("storage", storage)}
                  />
                  {storage}
                </label>
              ))}
            </div>
          </div>

          {/* Grade */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Grade</Label>
            <div className="flex gap-2">
              {gradeOptions.map((grade) => (
                <label
                  key={grade}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={localFilters.grades.includes(grade)}
                    onCheckedChange={() => toggleArrayFilter("grades", grade)}
                  />
                  Grade {grade}
                </label>
              ))}
            </div>
          </div>

          {/* Color */}
          {availableColors.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Color</Label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <label
                    key={color}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Checkbox
                      checked={localFilters.colors.includes(color)}
                      onCheckedChange={() => toggleArrayFilter("colors", color)}
                    />
                    {color}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Battery Range */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Battery Health: {localFilters.batteryRange[0]}% – {localFilters.batteryRange[1]}%
            </Label>
            <Slider
              value={localFilters.batteryRange}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  batteryRange: value as [number, number],
                }))
              }
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Price: €{localFilters.priceRange[0]} – €{localFilters.priceRange[1]}
            </Label>
            <Slider
              value={localFilters.priceRange}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  priceRange: value as [number, number],
                }))
              }
              min={0}
              max={2000}
              step={50}
              className="w-full"
            />
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
          <Button onClick={handleApply} className="w-full">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
