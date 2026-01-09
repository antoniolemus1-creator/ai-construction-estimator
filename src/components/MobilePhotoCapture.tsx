import { useState, useRef } from 'react';
import { Camera, X, Loader2, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useGeolocation } from '@/hooks/useGeolocation';
import { offlineStorage } from '@/lib/offlineStorage';

interface Photo {
  id: string;
  url: string;
  timestamp: Date;
  location?: { latitude: number; longitude: number; accuracy: number };
  analysis?: any;
  analyzing?: boolean;
}


export function MobilePhotoCapture() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [capturing, setCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { location, requestLocation } = useGeolocation();


  const analyzeImage = async (photoId: string, file: File) => {
    try {
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, analyzing: true } : p
      ));

      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });

      const base64 = (reader.result as string).split(',')[1];

      const { data, error } = await supabase.functions.invoke('analyze-construction-image', {
        body: { imageBase64: base64 }
      });

      if (error) throw error;

      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, analysis: data.analysis, analyzing: false } : p
      ));

      // Update localStorage with analysis
      const storedPhotos = JSON.parse(localStorage.getItem('sitePhotos') || '[]');
      const updatedStoredPhotos = storedPhotos.map((p: any) => 
        p.id === photoId ? { ...p, analysis: data.analysis } : p
      );
      localStorage.setItem('sitePhotos', JSON.stringify(updatedStoredPhotos));


      toast({ 
        title: 'Analysis Complete', 
        description: `Detected ${data.analysis?.elements?.length || 0} elements` 
      });
    } catch (error) {
      toast({ title: 'Analysis Failed', variant: 'destructive' });
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, analyzing: false } : p
      ));
    }
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setCapturing(true);
      requestLocation(); // Request GPS location
      const file = files[0];
      const url = URL.createObjectURL(file);
      
      const newPhoto: Photo = {
        id: Date.now().toString(),
        url,
        timestamp: new Date(),
        location: location ? { 
          latitude: location.latitude, 
          longitude: location.longitude,
          accuracy: location.accuracy 
        } : undefined
      };

      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      
      // Save to offline storage
      await offlineStorage.save({
        id: newPhoto.id,
        type: 'photo',
        data: { ...newPhoto, file: file.name },
        location: newPhoto.location,
        timestamp: Date.now(),
        synced: false
      });

      // Store with imageData for Procore sync
      const photoForStorage = {
        ...newPhoto,
        imageData: url,
        file: file.name
      };
      const storedPhotos = JSON.parse(localStorage.getItem('sitePhotos') || '[]');
      localStorage.setItem('sitePhotos', JSON.stringify([...storedPhotos, photoForStorage]));

      toast({ title: 'Photo captured', description: 'Analyzing image...' });
      
      // Analyze the image
      await analyzeImage(newPhoto.id, file);
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setCapturing(false);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    localStorage.setItem('site-photos', JSON.stringify(photos.filter(p => p.id !== id)));
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5" />
        AI Photo Analysis
      </h3>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />
      
      <Button 
        onClick={() => fileInputRef.current?.click()}
        disabled={capturing}
        className="w-full mb-4"
      >
        <Camera className="w-4 h-4 mr-2" />
        {capturing ? 'Capturing...' : 'Take & Analyze Photo'}
      </Button>

      <div className="space-y-4">
        {photos.map(photo => (
          <Card key={photo.id} className="p-3">
            <div className="relative mb-2">
              <img src={photo.url} alt="Site" className="w-full h-48 object-cover rounded" />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              {photo.location && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {photo.location.latitude.toFixed(4)}, {photo.location.longitude.toFixed(4)}
                </div>
              )}
            </div>

            
            {photo.analyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing image...
              </div>
            )}
            
            {photo.analysis && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">AI Analysis</span>
                </div>
                
                {photo.analysis.elements?.length > 0 && (
                  <div>
                    <span className="font-medium">Elements:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {photo.analysis.elements.map((el: string, i: number) => (
                        <Badge key={i} variant="secondary">{el}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {photo.analysis.materials?.length > 0 && (
                  <div>
                    <span className="font-medium">Materials:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {photo.analysis.materials.map((mat: string, i: number) => (
                        <Badge key={i} variant="outline">{mat}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {photo.analysis.estimatedCost && (
                  <div className="bg-green-50 p-2 rounded">
                    <span className="font-medium">Est. Cost:</span> ${photo.analysis.estimatedCost.min?.toLocaleString()} - ${photo.analysis.estimatedCost.max?.toLocaleString()}
                  </div>
                )}
                
                {photo.analysis.notes && (
                  <p className="text-xs text-muted-foreground">{photo.analysis.notes}</p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </Card>
  );
}
