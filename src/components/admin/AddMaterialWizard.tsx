import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AddMaterialWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMaterialWizard({ open, onClose, onSuccess }: AddMaterialWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    material_name: '',
    material_category: 'lumber',
    material_subcategory: '',
    brand_name: '',
    manufacturer: '',
    naics_code: '',
    unit_of_measure: 'piece',
    base_price: '',
    price_per_unit: '',
    description: '',
    product_code: '',
    is_specialty: false,
  });

  const handleSubmit = async () => {
    try {
      const { error } = await supabase.from('construction_materials').insert([{
        ...formData,
        base_price: parseFloat(formData.base_price),
        price_per_unit: parseFloat(formData.price_per_unit),
        available_states: ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'],
      }]);

      if (error) throw error;
      toast.success('Material added successfully');
      onSuccess();
      onClose();
      setStep(1);
      setFormData({
        material_name: '', material_category: 'lumber', material_subcategory: '',
        brand_name: '', manufacturer: '', naics_code: '', unit_of_measure: 'piece',
        base_price: '', price_per_unit: '', description: '', product_code: '', is_specialty: false,
      });
    } catch (error: any) {
      toast.error('Failed to add material: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Material - Step {step} of 3</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Material Name*</Label>
              <Input value={formData.material_name} onChange={(e) => setFormData({...formData, material_name: e.target.value})} />
            </div>
            <div>
              <Label>Category*</Label>
              <select value={formData.material_category} onChange={(e) => setFormData({...formData, material_category: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="lumber">Lumber</option>
                <option value="metal_framing">Metal Framing</option>
                <option value="drywall">Drywall</option>
                <option value="act_ceiling">ACT Ceiling</option>
                <option value="insulation">Insulation</option>
              </select>
            </div>
            <div>
              <Label>Subcategory</Label>
              <Input value={formData.material_subcategory} onChange={(e) => setFormData({...formData, material_subcategory: e.target.value})} placeholder="e.g., studs, panels, tiles" />
            </div>
            <Button onClick={() => setStep(2)} className="w-full">Next</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Brand Name</Label>
              <Input value={formData.brand_name} onChange={(e) => setFormData({...formData, brand_name: e.target.value})} />
            </div>
            <div>
              <Label>Manufacturer</Label>
              <Input value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} />
            </div>
            <div>
              <Label>NAICS Code</Label>
              <Input value={formData.naics_code} onChange={(e) => setFormData({...formData, naics_code: e.target.value})} placeholder="e.g., 423310" />
            </div>
            <div>
              <Label>Product Code</Label>
              <Input value={formData.product_code} onChange={(e) => setFormData({...formData, product_code: e.target.value})} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Unit of Measure*</Label>
              <select value={formData.unit_of_measure} onChange={(e) => setFormData({...formData, unit_of_measure: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="piece">Piece</option>
                <option value="sheet">Sheet</option>
                <option value="linear_feet">Linear Feet</option>
                <option value="square_feet">Square Feet</option>
                <option value="bundle">Bundle</option>
              </select>
            </div>
            <div>
              <Label>Price Per Unit*</Label>
              <Input type="number" step="0.01" value={formData.price_per_unit} onChange={(e) => setFormData({...formData, price_per_unit: e.target.value, base_price: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_specialty} onChange={(e) => setFormData({...formData, is_specialty: e.target.checked})} />
              <Label>Specialty Material</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1">Back</Button>
              <Button onClick={handleSubmit} className="flex-1">Add Material</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
