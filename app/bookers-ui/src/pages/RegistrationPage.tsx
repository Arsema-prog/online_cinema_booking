import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Button } from "@/components/ui/Button";
import { Loader2, CheckCircle2 } from "lucide-react";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export const RegistrationPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        roles: ["USER"],
      });
      
      setSuccess(true);
      
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = (): void => {
    navigate('/');
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fadeIn">
        <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-border text-center shadow-lg">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-headline font-bold text-foreground mb-4">Registration Successful!</h2>
          <p className="mb-8 text-muted-foreground text-sm">
            Your account has been created. Please log in to continue.
          </p>
          <Button 
            onClick={handleBackToLogin}
            className="w-full text-base font-bold shadow-sm h-12 rounded-xl"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fadeIn">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="w-full max-w-[450px] p-8 md:p-10 rounded-3xl bg-card border border-border shadow-xl relative overflow-hidden">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headline font-bold mb-2 text-foreground tracking-tight">Create Account</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Join ATLAS Cinema today
          </p>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl mb-6 border border-destructive/20 font-medium text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">First Name</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                className="w-full rounded-md px-3 bg-muted text-foreground border-border h-11 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Last Name</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                className="w-full rounded-md px-3 bg-muted text-foreground border-border h-11 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Username *</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              className="w-full rounded-md px-3 bg-muted text-foreground border-border h-11 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Email *</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="w-full rounded-md px-3 bg-muted text-foreground border-border h-11 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Password *</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full rounded-md px-3 bg-muted text-foreground border-border h-11 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
            />
          </div>
          
          <div className="space-y-2 mb-6">
            <label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Confirm Password *</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full rounded-md px-3 bg-muted text-foreground border-border h-11 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-bold rounded-xl mt-6 shadow-md"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Account...</>
            ) : "Sign Up"}
          </Button>
        </form>
        
        <div className="mt-8 text-center text-sm text-muted-foreground font-medium">
          Already have an account?{" "}
          <button
            onClick={handleBackToLogin}
            className="text-primary hover:text-primary/80 font-bold hover:underline transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};