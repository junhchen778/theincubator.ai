import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, User as UserIcon } from 'lucide-react';

interface FollowChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (asFirm: boolean) => void;
  userName: string;
  userAvatar?: string;
  firmName: string;
  firmLogo?: string;
  companyName: string;
}

export function FollowChoiceModal({
  isOpen,
  onClose,
  onChoose,
  userName,
  userAvatar,
  firmName,
  firmLogo,
  companyName,
}: FollowChoiceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Follow {companyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Would you like to follow as yourself or on behalf of your firm?
          </p>

          {/* Follow as Firm */}
          <button
            onClick={() => onChoose(true)}
            className="w-full p-4 border-2 rounded-lg hover:border-primary hover:bg-muted transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={firmLogo} />
                <AvatarFallback>
                  <Building2 className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{firmName}</p>
                <p className="text-xs text-muted-foreground">
                  Company will appear in your firm's deal pipeline
                </p>
              </div>
            </div>
          </button>

          {/* Follow as Individual */}
          <button
            onClick={() => onChoose(false)}
            className="w-full p-4 border-2 rounded-lg hover:border-primary hover:bg-muted transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userAvatar} />
                <AvatarFallback>
                  <UserIcon className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{userName}</p>
                <p className="text-xs text-muted-foreground">
                  Follow personally (private to you)
                </p>
              </div>
            </div>
          </button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

