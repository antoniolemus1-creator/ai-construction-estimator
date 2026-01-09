import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaterialsManager } from '@/components/admin/MaterialsManager';
import { LaborRatesManager } from '@/components/admin/LaborRatesManager';
import { AccessDBImporter } from '@/components/admin/AccessDBImporter';
import { MaterialTemplatesManager } from '@/components/admin/MaterialTemplatesManager';
import { Package, Users, Database, Sparkles } from 'lucide-react';


export default function MaterialsAndLaborPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Materials & Labor Database</h1>
        <p className="text-gray-600">
          Manage construction materials and labor rates across all 50 states with NAICS classification
        </p>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Import Access DB
          </TabsTrigger>
          <TabsTrigger value="labor" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Labor Rates
          </TabsTrigger>
        </TabsList>


        <TabsContent value="materials" className="mt-6">
          <MaterialsManager />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <MaterialTemplatesManager />
        </TabsContent>


        <TabsContent value="import" className="mt-6">
          <AccessDBImporter />
        </TabsContent>

        <TabsContent value="labor" className="mt-6">
          <LaborRatesManager />
        </TabsContent>
      </Tabs>

    </div>
  );
}
