import { useState } from 'react';
import { Smartphone, Camera, Mic, Calculator, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobilePhotoCapture } from './MobilePhotoCapture';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { OfflineEstimateForm } from './OfflineEstimateForm';

export function MobileFieldView() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-blue-600" />
            <h1 className="font-bold text-lg">Field Estimator</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        <Card className="mb-4 p-4 bg-blue-600 text-white">
          <h2 className="text-xl font-bold mb-2">Welcome, Field Worker</h2>
          <p className="text-sm opacity-90">
            Capture site data, record notes, and create estimates on-the-go with offline support.
          </p>
        </Card>

        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="photos" className="text-xs sm:text-sm">
              <Camera className="w-4 h-4 mr-1" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs sm:text-sm">
              <Mic className="w-4 h-4 mr-1" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="estimate" className="text-xs sm:text-sm">
              <Calculator className="w-4 h-4 mr-1" />
              Estimate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos">
            <MobilePhotoCapture />
          </TabsContent>

          <TabsContent value="voice">
            <VoiceNoteRecorder />
          </TabsContent>

          <TabsContent value="estimate">
            <OfflineEstimateForm />
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-xs text-gray-600">Photos</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-xs text-gray-600">Voice Notes</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">5</div>
            <div className="text-xs text-gray-600">Estimates</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
