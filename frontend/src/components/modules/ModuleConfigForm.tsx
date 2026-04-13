"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ConfigField = {
  key: string;
  type: "boolean" | "number" | "string" | "select" | "multiselect" | "text" | "time" | "date";
  label: string;
  description?: string;
  options?: Array<{ label: string; value: string }>;
};

type ConfigSection = {
  key: string;
  title: string;
  description: string;
  fields: ConfigField[];
};

type Props = {
  sections: ConfigSection[];
  value: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
};

export function ModuleConfigForm({ sections, value, onChange }: Props) {
  function setField(key: string, next: any) {
    onChange({
      ...value,
      [key]: next,
    });
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                {field.type === "boolean" ? (
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={Boolean(value[field.key])}
                      onCheckedChange={(checked) => setField(field.key, Boolean(checked))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {field.description ?? "Toggle this setting"}
                    </span>
                  </div>
                ) : null}
                {field.type === "text" ? (
                  <Textarea
                    value={String(value[field.key] ?? "")}
                    onChange={(event) => setField(field.key, event.target.value)}
                  />
                ) : null}
                {field.type === "select" ? (
                  <Select
                    value={String(value[field.key] ?? "")}
                    onValueChange={(next) => setField(field.key, next)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {field.type !== "boolean" && field.type !== "text" && field.type !== "select" ? (
                  <Input
                    type={
                      field.type === "number"
                        ? "number"
                        : field.type === "time"
                          ? "time"
                          : field.type === "date"
                            ? "date"
                            : "text"
                    }
                    value={String(value[field.key] ?? "")}
                    onChange={(event) =>
                      setField(
                        field.key,
                        field.type === "number" ? Number(event.target.value) : event.target.value
                      )
                    }
                  />
                ) : null}
                {field.description && field.type !== "boolean" ? (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
