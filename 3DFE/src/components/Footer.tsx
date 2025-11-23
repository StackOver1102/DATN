import Image from "next/image";
import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      {/* Main Footer */}
      <div className="bg-black py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Left Links */}
            <div className="flex flex-wrap gap-6 mb-4 md:mb-0">
              <Link
                href="/terms"
                className="text-gray-300 hover:text-white text-sm transition-colors"
              >
                Terms Of Use
              </Link>
              <Link
                href="/privacy"
                className="text-gray-300 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/contact"
                className="text-gray-300 hover:text-white text-sm transition-colors"
              >
                Contact Us
              </Link>
            </div>

            {/* Right Section */}
            <div className="flex flex-col items-center md:items-end gap-3">
              {/* Social Media Icons */}
              <div className="flex gap-3">
                {/* Facebook */}
                <Link
                  href="https://www.facebook.com/3dvn.org"
                  className="w-8 h-8  hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </Link>

                {/* Instagram */}
                <Link
                  href="https://www.instagram.com/3dvnorg/"
                  className="w-8 h-8  hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </Link>

                {/* TikTok */}
                <Link
                  href="https://www.tiktok.com/@3dvn.org"
                  className="w-8 h-8  hover:bg-black rounded-full flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </Link>

                {/* Pinterest */}
                <Link
                  href="https://www.pinterest.com/3dvn_org/"
                  className="w-8 h-8  hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.219-.359-1.219c0-1.142.662-1.995 1.488-1.995.701 0 1.039.526 1.039 1.155 0 .703-.448 1.754-.719 2.728-.219.903.452 1.637 1.342 1.637 1.610 0 2.846-1.697 2.846-4.142 0-2.165-1.558-3.679-3.783-3.679-2.578 0-4.086 1.933-4.086 3.933 0 .778.299 1.609.670 2.062.074.090.084.169.062.260-.069.286-.225.896-.256 1.021-.041.167-.135.202-.311.122-1.106-.513-1.799-2.123-1.799-3.42 0-2.851 2.071-5.471 5.967-5.471 3.131 0 5.565 2.234 5.565 5.218 0 3.111-1.961 5.617-4.686 5.617-.915 0-1.777-.477-2.071-1.048l-.56 2.149c-.203.783-.755 1.764-1.124 2.361 .845.261 1.739.401 2.668.401 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z" />
                  </svg>
                </Link>

                {/* YouTube */}
                <Link
                  href="https://www.youtube.com/@3dvn-org/featured"
                  className="w-8 h-8  hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </Link>
              </div>

              {/* Contact Info */}
              <div className="text-center md:text-right text-xs ">
                <div>
                  © model3dvn.org, {new Date().getFullYear()} Specializing in
                  providing providing 3dsmax models
                </div>
                <div>📍 Ho Chi Minh City, VIET NAM</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="bg-neutral-700 py-3 text-center flex item-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 text-sm ">
            <div className="">
              <Image
                src="/dmca-badge-w100-5x1-09.png"
                alt="3DVN.ORG"
                width={100}
                height={100}
              />
            </div>

            <span>Copyright {new Date().getFullYear()} © 3DVN.ORG</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
