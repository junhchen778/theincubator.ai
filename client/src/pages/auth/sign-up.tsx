import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signUp } from '@/lib/auth';
import type { UserType } from '@/lib/supabase';
import { Briefcase, User, Building2, AlertCircle, Loader2 } from 'lucide-react';

const USER_TYPES = [
  {
    type: 'founder' as UserType,
    icon: Briefcase,
    title: 'Founder',
    description: 'Share your startup journey and connect with investors',
  },
  {
    type: 'individual_investor' as UserType,
    icon: User,
    title: 'Individual Investor',
    description: 'Discover and invest in promising startups',
  },
  {
    type: 'firm_member' as UserType,
    icon: Building2,
    title: 'VC Firm Member',
    description: 'Represent your firm and scout investments',
  },
];

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedType) {
      setError('Please select a user type');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        userType: selectedType,
      });

      // Check if email confirmation is required
      if (result.session === null && result.user) {
        // Email confirmation required
        setShowEmailVerification(true);
        setLoading(false);
      } else if (result.session) {
        // User is logged in immediately (email confirmation disabled)
        // Redirect based on user type
        if (selectedType === 'founder') {
          setLocation('/onboarding/company');
        } else if (selectedType === 'individual_investor') {
          setLocation('/onboarding/investor');
        } else if (selectedType === 'firm_member') {
          setLocation('/onboarding/firm');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.');
      setLoading(false);
    }
  };

  // Show email verification success screen
  if (showEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{formData.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-2">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check your email inbox</li>
                <li>Click the verification link</li>
                <li>You'll be redirected back to complete your profile</li>
              </ol>
            </div>
            <p className="text-sm text-slate-600 text-center">
              Didn't receive the email? Check your spam folder or{' '}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => {
                  setShowEmailVerification(false);
                  setError('');
                }}
              >
                try signing up again
              </Button>
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation('/auth/sign-in')}
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Join Incubator.ai</h1>
          <p className="text-slate-600 mt-2">Choose your role to get started</p>
        </div>

        {!selectedType ? (
          <div className="grid md:grid-cols-3 gap-6">
            {USER_TYPES.map((userType) => {
              const Icon = userType.icon;
              return (
                <Card
                  key={userType.type}
                  className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
                  onClick={() => setSelectedType(userType.type)}
                >
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>{userType.title}</CardTitle>
                    <CardDescription className="min-h-[48px]">
                      {userType.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button className="w-full">
                      Continue as {userType.title}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>
                Signing up as{' '}
                <span className="font-semibold">
                  {USER_TYPES.find(t => t.type === selectedType)?.title}
                </span>
                <Button
                  variant="link"
                  className="ml-2 p-0 h-auto"
                  onClick={() => setSelectedType(null)}
                >
                  Change
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => setLocation('/auth/sign-in')}
                    type="button"
                  >
                    Sign In
                  </Button>
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

