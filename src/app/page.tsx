"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  return (
    <div className='bg-yellow-300 rounded-3xl m-2 w-[98vw] min-h-[97vh]'>
      <div className='w-full flex justify-center pt-8'>
        <nav className='navbar bg-white rounded-full p-2 shadow-lg'>
          <ul className='flex gap-16 w-full items-center px-4'>
            <li className='font-medium cursor-pointer'>Home</li>
            <li className='font-medium cursor-pointer'>About</li>
            <li className='font-medium cursor-pointer'>Contact</li>
            <li>
              <button 
                onClick={() => router.push('/login')} 
                className='bg-black text-white px-5 py-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors'
              >
                Get Started
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className='herosection grid grid-cols-1 md:grid-cols-2 gap-20 items-center px-10 py-16 max-w-7xl mx-auto'>
        <div className='left-div flex flex-col gap-8'>
          <h1 className='text-5xl font-bold text-zinc-900 leading-tight'>Meet QuickReply !</h1>
          <p className='text-xl text-zinc-800 leading-relaxed max-w-xl'>
            Automate YouTube comment replies with customisable keyword rules. Save time, engage your audience instantly, and never miss repetitive questions again.
          </p>
        </div>

        <div className='right-div flex justify-center'>
          <img 
            src="/younggirl.jpg" 
            alt="younggirl" 
            className='w-[500px] rounded-3xl shadow-2xl object-cover'
          />
        </div>
      </div>
    </div>
  );
}
