import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { CompanyWithFounders, VCFirm, User } from '@/lib/types';
import { Building2, Info, Star, Loader2, X } from 'lucide-react';
import { StageBadge } from '@/components/stage-badge';
import { SectorBadge } from '@/components/sector-badge';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface ExpressInterestModalProps {
  company: CompanyWithFounders;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExpressInterestModal({ company, isOpen, onClose, onSuccess }: ExpressInterestModalProps) {
  const [message, setMessage] = useState('');
  const [asFirm, setAsFirm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firm, setFirm] = useState<VCFirm | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const maxLength = 200;

  useEffect(() => {
    async function loadUserData() {
      const user = await getCurrentUser();
      setCurrentUser(user);

      if (user?.user_type === 'firm_member') {
        // Get firm info
        const { data: firmMember } = await supabase
          .from('firm_members')
          .select('firm_id, firm:vc_firms(*)')
          .eq('user_id', user.id)
          .single();

        if (firmMember?.firm) {
          setFirm(firmMember.firm as VCFirm);
          setAsFirm(true); // Default to expressing as firm
        }
      }
    }

    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!currentUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Check if already expressed interest
      const { data: existingInterest } = await supabase
        .from('company_interests')
        .select('id')
        .eq('company_id', company.id)
        .eq('investor_id', currentUser.id)
        .single();

      if (existingInterest) {
        setError("You've already expressed interest in this company");
        setIsSubmitting(false);
        return;
      }

      // Insert interest
      const { error: insertError } = await supabase
        .from('company_interests')
        .insert({
          company_id: company.id,
          investor_id: currentUser.id,
          firm_id: asFirm && firm ? firm.id : null,
          message: message.trim() || null,
        });

      if (insertError) throw insertError;

      // Create firm activity if expressing as firm
      if (asFirm && firm) {
        await supabase.from('firm_activity').insert({
          firm_id: firm.id,
          member_id: currentUser.id,
          action_type: 'expressed_interest',
          company_id: company.id,
          metadata: { message: message.trim() || null },
        });
      }

      // Show success
      toast({
        title: "Interest Expressed!",
        description: `You've expressed interest in ${company.name}`,
      });

      // Confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      onSuccess();
      onClose();
      setMessage('');
    } catch (err) {
      console.error('Error expressing interest:', err);
      setError('Failed to express interest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Express Interest in {company.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Preview */}
          <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src={company.logo_url || undefined} />
              <AvatarFallback>
                <Building2 className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1">{company.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {company.one_line_pitch || 'No pitch available'}
              </p>
              <div className="flex flex-wrap gap-2">
                {company.stage && <StageBadge stage={company.stage} />}
                {company.sector?.slice(0, 2).map((sector) => (
                  <SectorBadge key={sector} sector={sector} />
                ))}
              </div>
            </div>
          </div>

          {/* Firm Member Choice */}
          {currentUser?.user_type === 'firm_member' && firm && (
            <div className="space-y-3">
              <Label>Express interest as:</Label>
              <RadioGroup value={asFirm ? 'firm' : 'personal'} onValueChange={(val) => setAsFirm(val === 'firm')}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="firm" id="firm" />
                  <Label htmlFor="firm" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={firm.logo_url || undefined} />
                      <AvatarFallback>
                        <Building2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span>{firm.name}</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="personal" id="personal" />
                  <Label htmlFor="personal" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatar_url || undefined} />
                      <AvatarFallback>
                        {currentUser.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{currentUser.full_name || 'You'}</span>
                    <span className="text-sm text-muted-foreground">(Personal)</span>
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-muted-foreground">
                Founders will see who expressed interest
              </p>
            </div>
          )}

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Add a message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Let the founders know why you're interested..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>e.g., "Would love to chat about your traction in fintech"</span>
              <span>{message.length}/{maxLength}</span>
            </div>
          </div>

          {/* Info Callout */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Founders will be notified and can see your interest. This is not a commitment to invest.
            </AlertDescription>
          </Alert>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Expressing Interest...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Express Interest
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

