import { LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const handleChange = (newValue: string) => {
    if (newValue === "grid" || newValue === "list") {
      onChange(newValue);
    }
  };

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={handleChange}
      className="border border-input rounded-lg p-1 bg-background"
    >
      <ToggleGroupItem
        value="grid"
        aria-label="Grid view"
        className="h-9 w-9 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md"
      >
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="list"
        aria-label="List view"
        className="h-9 w-9 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md"
      >
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
