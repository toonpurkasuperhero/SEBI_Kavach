import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, LogIn } from 'lucide-react';
import { cn } from '../utils';
import { useAuth } from '../context/AuthContext';



const Layout = () => {
  const { userRole, logout } = useAuth();
  const [isDark, setIsDark] = useState(true); // Default to dark mode
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const navLinks = [
    { name: 'Dashboard', path: '/', roles: ['investor', 'admin'] },
    { name: 'Scam Radar', path: '/radar', roles: ['investor', 'admin'] },
    { name: 'ShieldTrain', path: '/training', roles: ['investor', 'admin'] },
    { name: 'Telegram Bot', path: '/bot', roles: ['investor', 'admin'] },
    { name: 'Social Feed', path: '/extension', roles: ['investor', 'admin'] },
    { name: 'Account Settings', path: '/settings', roles: ['investor', 'admin'] },
    { name: 'Admin Console', path: '/admin', roles: ['admin'] },
  ];

  const filteredLinks = navLinks.filter(link => link.roles.includes(userRole));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        {/* Desktop and Tablet Navbar */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 shrink-0">
            <img src="/logo.png" alt="SEBI Kavach Logo" className={cn("h-10 w-10 object-contain", isDark ? "invert" : "")} />
            <span className="font-bold text-xl tracking-tight hidden sm:block">SEBI Kavach</span>
          </div>
          
          {/* Always visible nav, horizontally scrollable on mobile */}
          <nav className="flex items-center space-x-4 md:space-x-8 overflow-x-auto no-scrollbar mx-4">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground/80 whitespace-nowrap",
                  location.pathname === link.path ? "text-foreground" : "text-foreground/60"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-card transition-colors shrink-0"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {userRole !== 'guest' ? (
              <button onClick={handleLogout} className="text-sm font-medium flex items-center hover:text-red-500 transition-colors shrink-0 hidden sm:flex">
                <LogOut size={18} className="mr-1" /> Logout
              </button>
            ) : (
              <Link to="/login" className="text-sm font-medium flex items-center hover:text-blue-500 transition-colors shrink-0 hidden sm:flex">
                <LogIn size={18} className="mr-1" /> Login
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-foreground/60">
          <p>© {new Date().getFullYear()} SEBI Kavach MVP. Hackathon Demo.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
