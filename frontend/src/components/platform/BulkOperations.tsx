"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Users, Building2, Shield } from "lucide-react";

interface BulkOperationProps {
  items: any[];
  itemType: 'tenants' | 'users';
  onBulkAction: (selectedIds: string[], action: string) => Promise<void>;
}

export function BulkOperations({ items, itemType, onBulkAction }: BulkOperationProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'suspend' | 'activate' | 'delete' | ''>('');
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(items.map(item => item._id || item.id));
      setSelectAll(true);
    }
  };

  const handleBulkAction = async () => {
    if (selectedItems.length === 0) return;
    
    setIsLoading(true);
    try {
      await onBulkAction(selectedItems, action);
      setSelectedItems([]);
      setSelectAll(false);
      setAction('');
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getItemName = (item: any) => {
    if (itemType === 'tenants') {
      return item.name || item.tenantId || 'Unknown';
    }
    return `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown';
  };

  const getItemCount = () => {
    if (selectAll) return items.length;
    return items.filter(item => item.status === 'active' || item.isActive).length;
  };

  const getCount = () => selectedItems.length;

  type BulkAction = 'suspend' | 'activate' | 'delete';

  return (
    <div className="space-y-4">
      {/* Selection controls */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <label className="text-sm font-medium">
              Select All ({getCount()} of {getItemCount()})
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {selectedItems.length} selected
            </Badge>
          </div>
        </div>

        <div className="flex space-x-2">
          {/* Suspend */}
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as BulkAction)}
            className="px-3 py-2 border rounded"
            disabled={selectedItems.length === 0 || isLoading}
          >
            <option value="">Choose action...</option>
            <option value="suspend">Suspend</option>
            <option value="activate">Activate</option>
            <option value="delete">Delete</option>
          </select>

          <Button
            variant={action === 'delete' ? 'destructive' : 'default'}
            onClick={handleBulkAction}
            disabled={selectedItems.length === 0 || isLoading}
            className="ml-2"
          >
            {isLoading ? 'Processing...' : `Execute ${action}`}
          </Button>
        </div>
      </div>

      {/* Selected items summary */}
      {selectedItems.length > 0 && (
        <div className="p-4 bg-info-bg rounded-lg border">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-info" />
            <span className="text-sm font-medium">
              {selectedItems.length} {itemType} selected for {action}
            </span>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedItems.slice(0, 10).map(id => {
              const item = items.find(i => (i._id || i.id) === id);
              return (
                <div key={id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedItems.includes(id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems(prev => [...prev, id]);
                        } else {
                          setSelectedItems(prev => prev.filter(i => i !== id));
                        }
                      }}
                    />
                    <span className="text-sm">{getItemName(item)}</span>
                  </div>
                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                    {item.status || 'Inactive'}
                  </Badge>
                </div>
              );
            })}
            {selectedItems.length > 10 && (
              <div className="text-center p-2 text-sm text-muted-foreground">
                ... and {selectedItems.length - 10} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
