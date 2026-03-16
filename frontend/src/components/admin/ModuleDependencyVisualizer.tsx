"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Package,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleDependency {
  moduleId: string;
  name: string;
  isInstalled: boolean;
  isActive: boolean;
  isCore: boolean;
  dependencies: string[];
  dependents: string[];
}

interface ModuleDependencyVisualizerProps {
  modules: ModuleDependency[];
  onModuleAction?: (moduleId: string, action: 'install' | 'uninstall' | 'activate' | 'deactivate') => void;
}

export function ModuleDependencyVisualizer({ 
  modules, 
  onModuleAction 
}: ModuleDependencyVisualizerProps) {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dependencies' | 'dependents'>('dependencies');

  const selectedModuleData = modules.find(m => m.moduleId === selectedModule);

  const getDependencyStatus = (moduleId: string) => {
    const module = modules.find(m => m.moduleId === moduleId);
    if (!module) return 'missing';
    if (module.isCore) return 'core';
    if (!module.isInstalled) return 'not-installed';
    if (!module.isActive) return 'inactive';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'core': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'active': return 'bg-em-success/10 text-em-success border-em-success/20';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'not-installed': return 'bg-red-100 text-red-800 border-red-200';
      case 'missing': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'core': return <Star className="h-3 w-3" />;
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'inactive': return <XCircle className="h-3 w-3" />;
      case 'not-installed':
      case 'missing': return <AlertTriangle className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const renderDependencyChain = (moduleId: string, depth: number = 0, visited: Set<string> = new Set()) => {
    if (visited.has(moduleId) || depth > 3) return null;
    visited.add(moduleId);

    const module = modules.find(m => m.moduleId === moduleId);
    if (!module) return null;

    const status = getDependencyStatus(moduleId);
    const isExpanded = selectedModule === moduleId;

    return (
      <div key={moduleId} className={cn("space-y-2", depth > 0 && "ml-6 border-l-2 border-muted pl-4")}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{module.name}</span>
            <Badge variant="outline" className={getStatusColor(status)}>
              {getStatusIcon(status)}
              <span className="ml-1">
                {status === 'core' ? 'Core' : 
                 status === 'active' ? 'Active' :
                 status === 'inactive' ? 'Inactive' :
                 status === 'not-installed' ? 'Not Installed' :
                 'Missing'}
              </span>
            </Badge>
            {module.isCore && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Star className="h-3 w-3 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Core module - always available</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {/* Action buttons */}
          {!module.isCore && onModuleAction && (
            <div className="flex gap-1">
              {!module.isInstalled && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onModuleAction(moduleId, 'install')}
                  disabled={status === 'missing'}
                >
                  Install
                </Button>
              )}
              {module.isInstalled && !module.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onModuleAction(moduleId, 'activate')}
                >
                  Activate
                </Button>
              )}
              {module.isInstalled && module.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onModuleAction(moduleId, 'deactivate')}
                >
                  Deactivate
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Render dependencies */}
        {module.dependencies.length > 0 && isExpanded && (
          <div className="space-y-2">
            {module.dependencies.map(depId => renderDependencyChain(depId, depth + 1, new Set(visited)))}
          </div>
        )}
      </div>
    );
  };

  const renderDependencyGraph = () => {
    if (!selectedModuleData) return null;

    const items = viewMode === 'dependencies' ? selectedModuleData.dependencies : selectedModuleData.dependents;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{selectedModuleData.name}</h3>
          <Badge variant="outline" className={getStatusColor(getDependencyStatus(selectedModuleData.moduleId))}>
            {getStatusIcon(getDependencyStatus(selectedModuleData.moduleId))}
            <span className="ml-1">
              {selectedModuleData.isCore ? 'Core' :
               selectedModuleData.isActive ? 'Active' :
               selectedModuleData.isInstalled ? 'Inactive' : 'Not Installed'}
            </span>
          </Badge>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {viewMode === 'dependencies' 
              ? 'This module has no dependencies' 
              : 'No other modules depend on this module'}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              <span>
                {viewMode === 'dependencies' ? 'Dependencies' : 'Dependent Modules'} ({items.length})
              </span>
            </div>
            
            <div className="space-y-2">
              {items.map(moduleId => renderDependencyChain(moduleId))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Module Dependencies
          </CardTitle>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'dependencies' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('dependencies')}
            >
              Dependencies
            </Button>
            <Button
              variant={viewMode === 'dependents' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('dependents')}
            >
              Dependents
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Module selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {modules.map(module => {
            const status = getDependencyStatus(module.moduleId);
            return (
              <Button
                key={module.moduleId}
                variant={selectedModule === module.moduleId ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedModule(module.moduleId)}
                className="justify-start"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="truncate">{module.name}</span>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Dependency graph */}
        {selectedModule && renderDependencyGraph()}
        
        {!selectedModule && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a module to view its dependency relationships</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
