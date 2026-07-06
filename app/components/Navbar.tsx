import { Link, Form } from "react-router";
import { useState, useRef, useEffect } from "react";
import type { JWTPayload } from "../../server/auth";

interface NavbarProps {
  user?: JWTPayload | null;
}

const Navbar = ({ user }: NavbarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-xl font-bold text-gradient">RESUMIND</p>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/upload" className="primary-button w-fit">
              Upload Resume
            </Link>
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-avatar-btn"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full primary-gradient flex items-center justify-center text-white font-semibold text-sm cursor-pointer border-2 border-transparent hover:border-[#606beb] transition-all"
                aria-label="User menu"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>

              {dropdownOpen && (
                <div className="avatar-dropdown">
                  <p className="avatar-dropdown-name">{user.name}</p>
                  <p className="avatar-dropdown-email">{user.email}</p>
                  <div className="avatar-dropdown-divider" />
                  <Form action="/sign-out" method="post">
                    <button
                      type="submit"
                      id="sign-out-btn"
                      className="avatar-dropdown-signout"
                    >
                      Sign Out
                    </button>
                  </Form>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/sign-in" className="primary-button w-fit">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;