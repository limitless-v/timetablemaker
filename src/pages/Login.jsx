import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '').trim();

    if (!email || !password) {
      setError('Please enter a valid email and password.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      window.localStorage.setItem('classmate-auth', JSON.stringify({ email, fullName: 'Admin User' }));
      setLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 gx-0 shadow rounded overflow-hidden" style={{ maxWidth: 1100, minHeight: 620 }}>
        <div className="col-lg-6 login-panel d-flex flex-column justify-content-center p-5">
          <div>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                <span className="fs-4 text-primary">C</span>
              </div>
              <div>
                <h1 className="h3 mb-1">ClassMate</h1>
                <p className="mb-0 text-white-75">Timetable Generator for academic scheduling.</p>
              </div>
            </div>
            <h2 className="h1 mb-4">Welcome back</h2>
            <p className="mb-4 text-white-75">Access your admin dashboard and manage faculty, classes, rooms, and timetables with ease.</p>
          </div>
          <div className="mt-auto text-white-50">
            <p className="mb-1">Built for smooth scheduling and conflict-free class planning.</p>
            <p className="mb-0">Responsive academic dashboard experience.</p>
          </div>
        </div>
        <div className="col-lg-6 bg-white d-flex align-items-center justify-content-center p-5">
          <div className="w-100" style={{ maxWidth: 420 }}>
            <h3 className="mb-4">Admin Login</h3>
            <form onSubmit={handleLogin} className="mb-4">
              {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input required type="email" name="email" className="form-control" placeholder="admin@classmate.edu" />
              </div>
              <div className="mb-3 position-relative">
                <label className="form-label">Password</label>
                <input required type={showPassword ? 'text' : 'password'} name="password" className="form-control" placeholder="Enter password" />
                <button type="button" className="btn btn-sm btn-link position-absolute top-50 end-0 translate-middle-y me-2 text-decoration-none" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="rememberMe" />
                  <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
                </div>
                <a href="#" className="small">Forgot Password?</a>
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>
            <div className="text-center mb-3 text-muted">or continue with</div>
            <button className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2">
              <LogIn size={18} /> Login with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
