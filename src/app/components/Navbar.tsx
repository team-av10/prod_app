"use client"
import React from 'react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';



export default function Navbar() {
  const { logout } = useAuth();
const router = useRouter();


const handleLogout = async () => {
  try {
    await logout();
    router.push('/auth');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

  return (
<div className="navbar bg-base-100 shadow-sm">
  <div className="navbar-start">
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
       <li><a href='/en'>English</a></li>
      <li><a href='/hi'>हिन्दी</a></li>
      <li><a href='/ta'>தமிழ்</a></li>
      </ul>
    </div>
    <a className="btn btn-ghost">
      <Image
        src="/av10-logo.png"
        alt="AV10 Logo"
        width={60}
        height={40}
        priority
        className="object-contain"
      />
    </a>
  </div>
  <div className="navbar-center hidden lg:flex">
    <ul className="menu menu-horizontal px-1">
      <li><a href='/en'>English</a></li>
      <li><a href='/hi'>हिन्दी</a></li>
      <li><a href='/ta'>தமிழ்</a></li>
    </ul>
  </div>
  <div className="navbar-end">
    <a onClick={handleLogout} className="btn bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white hover:from-emerald-500 hover:via-teal-400 hover:to-cyan-400 transform hover:scale-105 hover:rotate-1 transition-all duration-300 shadow-lg hover:shadow-xl rounded-full px-6 border-0 hover:brightness-110 active:scale-95">👋</a>
  </div>
</div>
  )
}
