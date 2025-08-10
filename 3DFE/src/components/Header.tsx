"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loading } from "./ui/loading";

import { useAppSelector } from "@/lib/store/hooks";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get user data from Redux store
  const {
    profile: userProfile,
    hasLoadedProfile,
    sessionLoaded,
  } = useAppSelector((state) => state.user);
  // Handle sign out
  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/models?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(""); // Clear the search input after submitting
    }
  };

  // Get the first letter of the user's name for avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  // Display full screen loading when signing out
  if (isLoggingOut) {
    return (
      <Loading
        variant="spinner"
        size="sm"
        text="Signing out..."
        fullScreen
      />
    );
  }

  // Check if the user is authenticated
  const isAuthenticated = status === "authenticated" && session?.user;

  // Prevent flickering by showing consistent UI based on combined state
  const showUserData =
    isAuthenticated && sessionLoaded && (hasLoadedProfile || !!userProfile);

  // // Show loading state only when session is truly loading (not on refresh)
  // const isLoading = status === "loading" && !sessionLoaded;

  // // Hiển thị loading nhỏ chỉ khi đang kiểm tra phiên đăng nhập lần đầu
  // if (isLoading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-[80px]">
  //       <Loading variant="spinner" size="sm" />
  //     </div>
  //   );
  // }

  return (
    <div>
      {/* Navbar - màu đen */}
      <nav className="bg-black text-white">
        <div className="max-w-7xl mx-auto pl-0.5">
          <div className="flex justify-between items-center h-12">
            {/* Left side - Navigation links */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
              <Link
                href="/models"
                className="text-sm hover:text-gray-300 transition-colors"
              >
                3D Models
              </Link>
              <Link
                href="/deposit"
                className="text-sm hover:text-gray-300 transition-colors"
              >
                Buy
              </Link>
              <Link
                href="/support"
                className="text-sm hover:text-gray-300 transition-colors"
              >
                Support
              </Link>
              {/* <Link
                href="/help"
                className="text-sm hover:text-gray-300 transition-colors"
              >
                Help
              </Link> */}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-white p-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header - màu trắng */}
      <header className="bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-center py-4 lg:h-20">
            {/* Mobile layout */}
            <div className="flex lg:hidden w-full justify-between items-center mb-4">
              {/* Logo mobile */}
              <Link href="/">
                <Image
                  src="/logo/logo.png"
                  alt="3dsky"
                  width={120}
                  height={180}
                  className="flex-shrink-0"
                />
              </Link>
              {/* Auth buttons mobile */}
              <div className="flex items-center space-x-2">
                {showUserData ? (
                  <>
                    <div className="flex items-center bg-white text-[#3A5B22] px-2 py-0.5 rounded-full text-xs">
                      <span className="font-medium">
                        ${userProfile?.balance || session.user.balance || 0}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Avatar className="h-8 w-8 cursor-pointer border-2 border-[#3A5B22]">
                          <AvatarImage
                            src={
                              userProfile?.avatar || session.user.image || ""
                            }
                            alt={
                              userProfile?.fullName ||
                              session.user.name ||
                              "User"
                            }
                          />
                          <AvatarFallback className="bg-white text-[#3A5B22]">
                            {getInitials(
                              userProfile?.fullName || session.user.name
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href="/profile"
                            className="cursor-pointer w-full"
                          >
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/settings"
                            className="cursor-pointer w-full"
                          >
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleSignOut}
                          className="cursor-pointer"
                        >
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="text-blue-600 transition-colors text-xs"
                    >
                      Join
                    </Link>
                    <Link
                      href="/signin"
                      className="text-blue-600 transition-colors text-xs flex items-center"
                    >
                      <Image
                        src="/icons/signin-arrow.svg"
                        alt="Sign in"
                        width={12}
                        height={12}
                        className="mr-1"
                      />
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Search bar mobile */}
            <div className="w-full lg:hidden mb-4">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search 3D models..."
                  className="w-full px-4 py-3 pl-4 pr-12 text-sm border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#e7e6e5]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  type="submit"
                  className="absolute right-0 top-1/2 transform -translate-y-1/2"
                  variant="ghost"
                  size="sm"
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </Button>
              </form>
            </div>

            {/* Desktop layout */}
            <div className="hidden lg:flex items-center flex-1">
              {/* Logo desktop */}
              <Link href="/">
                <Image
                  src="/logo/logo.png"
                  alt="3dsky"
                  width={200}
                  height={300}
                  className="flex-shrink-0"
                />
              </Link>

              {/* Search bar desktop */}
              <div className="flex-1 max-w-xl mx-4 xl:mx-3 ">
                <form onSubmit={handleSearch} className="relative mt-3.5">
                  <Input
                    type="text"
                    placeholder="Search 3D models, textures, materials..."
                    className="w-full px-4 py-5 pl-4 pr-12 text-sm border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#e7e6e5] hover:bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button
                    type="submit"
                    className="absolute right-0 top-1/2 transform -translate-y-1/2"
                    variant="ghost"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </Button>
                </form>
              </div>
            </div>

            {/* Auth buttons desktop */}
            <div className="hidden lg:flex items-center space-x-4">
              {showUserData ? (
                <>
                  <div className="flex items-center bg-white text-yellow-400 px-3 py-1 rounded-full">
                    <span className="font-medium">
                      ${userProfile?.balance || session.user.balance || 0}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                        <Avatar className="h-10 w-10 border-2 border-yellow-400">
                          <AvatarImage
                            src={
                              userProfile?.avatar || session.user.image || ""
                            }
                            alt={
                              userProfile?.fullName ||
                              session.user.name ||
                              "User"
                            }
                          />
                          <AvatarFallback className="bg-white text-[#3A5B22]">
                            {getInitials(
                              userProfile?.fullName || session.user.name
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Your Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer w-full">
                          Personal Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/profile?tab=purchases"
                          className="cursor-pointer w-full"
                        >
                          Purchase History
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="cursor-pointer text-red-500 focus:text-red-500"
                      >
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="text-blue-600 transition-colors text-base"
                  >
                    Join
                  </Link>
                  <Link
                    href="/signin"
                    className="text-blue-600 transition-colors text-base flex items-center"
                  >
                    <Image
                      src="/icons/signin-arrow.svg"
                      alt="Sign in"
                      width={24}
                      height={24}
                      className="mr-1"
                    />
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
