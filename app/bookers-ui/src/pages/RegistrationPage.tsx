import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export const RegistrationPage: React.FC = () => {
  const { register, login } = useAuth();
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

  // Add this function inside your RegistrationPage component
const testBackendConnection = async () => {
  console.log('🔍 TESTING BACKEND CONNECTION');
  
  try {
    // Test 1: OPTIONS request (CORS preflight)
    console.log('Test 1: OPTIONS request (CORS preflight)');
    const optionsResponse = await fetch('http://localhost:8084/api/auth/register', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5174',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('OPTIONS Response Status:', optionsResponse.status);
    console.log('OPTIONS Response Headers:', [...optionsResponse.headers.entries()]);
    
    // Check for CORS headers
    const allowOrigin = optionsResponse.headers.get('access-control-allow-origin');
    if (allowOrigin) {
      console.log('✅ CORS Header present:', allowOrigin);
    } else {
      console.log('❌ CORS Header MISSING!');
    }
    
    // Test 2: Simple POST request
    console.log('\nTest 2: POST request');
    const postResponse = await fetch('http://localhost:8084/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test_' + Date.now(),
        email: 'test_' + Date.now() + '@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    console.log('POST Response Status:', postResponse.status);
    const text = await postResponse.text();
    console.log('POST Response Body:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Parsed Response:', json);
    } catch(e) {
      console.log('Response is not JSON:', text);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
};


  const handleBackToLogin = (): void => {
    navigate('/');
  };

 // In your RegistrationPage, when registration is successful, change the button to:
if (success) {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "#020617", 
      color: "white" 
    }}>
      <div style={{ 
        width: 400, 
        padding: 32, 
        borderRadius: 8, 
        background: "#0f172a", 
        textAlign: "center" 
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ color: "#10b981", marginBottom: 16 }}>Registration Successful!</h2>
        <p style={{ marginBottom: 24, color: "#cbd5f5" }}>
          Your account has been created. Please log in to continue.
        </p>
        <a 
          href="/" 
          style={{
            display: "inline-block",
            width: "100%",
            padding: "12px",
            borderRadius: 4,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            background: "#4f46e5",
            color: "white",
            fontSize: 16,
            textDecoration: "none",
            textAlign: "center"
          }}
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "#020617", 
      color: "white",
      padding: "20px"
    }}>
      <div style={{ 
        width: 450, 
        padding: 32, 
        borderRadius: 8, 
        background: "#0f172a", 
        boxShadow: "0 10px 25px rgba(15,23,42,0.8)" 
      }}>
        <h1 style={{ fontSize: 28, marginBottom: 8, textAlign: "center" }}>Create Account</h1>
        <p style={{ marginBottom: 24, textAlign: "center", color: "#cbd5f5" }}>
          Sign up for online cinema booking
        </p>
        
        {error && (
          <div style={{ 
            backgroundColor: "#f87171", 
            color: "white", 
            padding: "12px", 
            borderRadius: "4px",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 4,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "white",
                fontSize: 14
              }}
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 4,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "white",
                fontSize: 14
              }}
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 4,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "white",
                fontSize: 14
              }}
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 4,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "white",
                fontSize: 14
              }}
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 4,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "white",
                fontSize: 14
              }}
            />
          </div>
          
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 4,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "white",
                fontSize: 14
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 4,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              background: "#4f46e5",
              color: "white",
              fontSize: 16,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
          Already have an account?{" "}
          <button
            onClick={handleBackToLogin}
            style={{
              background: "none",
              border: "none",
              color: "#4f46e5",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14
            }}
          >
            Sign In
          </button>
         
        </div>
      </div>
    </div>
  );
};