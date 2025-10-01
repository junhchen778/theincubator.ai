import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CompanyOnboardingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Tell us about your company</CardTitle>
          <CardDescription>
            Let's set up your company profile to start connecting with investors
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-600">
            This onboarding flow is coming soon!
          </p>
          <Button onClick={() => setLocation('/feed')}>
            Skip for now → Go to Feed
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

