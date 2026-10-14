import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Sparkles, Mail, Lock, Eye, EyeOff, User, UserPlus } from 'lucide-react';
import Spinner from '../components/Spinner.jsx';

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ name, email, password }) => {
    setLoading(true);
    try {
      await authRegister(name, email, password);
      toast.success('Account created! Welcome to MeetMind.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glows */}
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)', top: -200, right: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', bottom: -100, left: -100, pointerEvents: 'none' }} />

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 24px rgba(34,211,238,0.3)',
            }}
          >
            <Sparkles size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Start building your meeting knowledge base
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Name */}
            <div className="form-group">
              <label className="label" htmlFor="name">Full name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
                <input
                  id="name"
                  type="text"
                  placeholder="Aditya Kumar"
                  autoComplete="name"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.25rem' }}
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />
              </div>
              {errors.name && <span className="error-msg">{errors.name.message}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="label" htmlFor="email">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.25rem' }}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                  })}
                />
              </div>
              {errors.email && <span className="error-msg">{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', padding: '4px' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="error-msg">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              {loading ? <Spinner size={18} color="white" /> : <UserPlus size={18} />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
