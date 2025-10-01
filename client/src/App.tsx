import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthHandler } from "@/components/auth-handler";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import SignUpPage from "@/pages/auth/sign-up";
import SignInPage from "@/pages/auth/sign-in";
import AuthCallbackPage from "@/pages/auth/callback";
import FeedPage from "@/pages/feed";
import CompanyOnboardingPage from "@/pages/onboarding/company";
import InvestorOnboardingPage from "@/pages/onboarding/investor";
import FirmOnboardingPage from "@/pages/onboarding/firm";
import ProfilePage from "@/pages/profile";
import ProfileEditPage from "@/pages/profile-edit";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/sign-up" component={SignUpPage} />
      <Route path="/auth/sign-in" component={SignInPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/feed">
        <ProtectedRoute>
          <FeedPage />
        </ProtectedRoute>
      </Route>
      <Route path="/onboarding/company">
        <ProtectedRoute>
          <CompanyOnboardingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/onboarding/investor">
        <ProtectedRoute>
          <InvestorOnboardingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/onboarding/firm">
        <ProtectedRoute>
          <FirmOnboardingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/profile/:id">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>
      <Route path="/profile/edit">
        <ProtectedRoute>
          <ProfileEditPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthHandler>
          <Toaster />
          <Router />
        </AuthHandler>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
