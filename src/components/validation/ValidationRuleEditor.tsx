import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, X } from 'lucide-react';

interface ValidationRuleEditorProps {
  rule?: any;
  open: boolean;
  onClose: () => void;
  onSave: (rule: any) => void;
}

export default function ValidationRuleEditor({ rule, open, onClose, onSave }: ValidationRuleEditorProps) {
  const [formData, setFormData] = useState(rule || {
    rule_name: '',
    rule_type: 'dimension',
    rule_category: 'format',
    validation_pattern: '',
    error_message: '',
    severity: 'warning',
    auto_correct: false,
    correction_template: '',
    is_active: true
  });

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit' : 'Create'} Validation Rule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Rule Name</Label>
            <Input value={formData.rule_name} onChange={e => setFormData({...formData, rule_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rule Type</Label>
              <Select value={formData.rule_type} onValueChange={v => setFormData({...formData, rule_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dimension">Dimension</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="room_label">Room Label</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.rule_category} onValueChange={v => setFormData({...formData, rule_category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="format">Format</SelectItem>
                  <SelectItem value="value_range">Value Range</SelectItem>
                  <SelectItem value="pattern_match">Pattern Match</SelectItem>
                  <SelectItem value="reference_check">Reference Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Validation Pattern (Regex)</Label>
            <Input value={formData.validation_pattern} onChange={e => setFormData({...formData, validation_pattern: e.target.value})} placeholder="e.g., \d+\s*(ft|in|m)" />
          </div>
          <div>
            <Label>Error Message</Label>
            <Textarea value={formData.error_message} onChange={e => setFormData({...formData, error_message: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={v => setFormData({...formData, severity: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 mt-8">
              <Switch checked={formData.auto_correct} onCheckedChange={v => setFormData({...formData, auto_correct: v})} />
              <Label>Auto-Correct</Label>
            </div>
          </div>
          {formData.auto_correct && (
            <div>
              <Label>Correction Template</Label>
              <Input value={formData.correction_template} onChange={e => setFormData({...formData, correction_template: e.target.value})} placeholder="e.g., $1 ft" />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}><X className="w-4 h-4 mr-2" />Cancel</Button>
            <Button onClick={handleSubmit}><Save className="w-4 h-4 mr-2" />Save Rule</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}