"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, MessageCircle, X, Zap, Bot, ChevronDown, Menu } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [menuOpen, setmenuOpen] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState("");

  const handleComingSoon = (title: string) => {
    setComingSoonTitle(title);
    if (menuOpen) setmenuOpen(false);
  };

  const faqs = [
    {
      question: "How does QuickReply work?",
      answer:
        "Create keyword rules, and QuickReply automatically replies whenever a matching YouTube comment is detected.",
    },
    {
      question: "Can I customize my replies?",
      answer:
        "Yes. You can create unlimited keywords and personalize every automatic response.",
    },
    {
      question: "Does it support multiple YouTube channels?",
      answer:
        "Yes. You can connect and manage multiple creator channels from one dashboard.",
    },
    {
      question: "Is QuickReply free?",
      answer:
        "Our hackathon version is completely free to use.",
    },
  ];

  return (
    <>
<<<<<<< HEAD:src/app/page.tsx
      <div className='bg-amber-100 min-h-screen'>
        <div className='bg-yellow-300 rounded-3xl m-1.5 w-[97.5vw] min-h-[75vh] md:min-h-[40vh] lg:min-h-[90vh]'>
=======
      <div className='bg-amber-100'>
        <div className='bg-yellow-300 m-0 w-full h-[75vh] md:h-[40vh] lg:h-[90vh]'>
>>>>>>> 5662598927237ef1c9eeb960ffa38d913bab6aff:src/App.jsx
          <div className='w-full flex justify-center pt-8'>
            <nav className='hidden md:flex justify-center navbar mx-auto bg-white rounded-full p-2 px-4 shadow-lg'>
              <div className='flex justify-between gap-10 items-center'>
                <div className='heading-font text-xl font-bold cursor-pointer'>QuickReply</div>

                <div>
                  <ul className='flex gap-16 w-full items-center cursor-pointer'>
                    <li className='text-sm font-semibold body-font'>Home</li>
                    <li className='text-sm font-semibold body-font' onClick={() => handleComingSoon("About Us")}>About Us</li>
                    <li className='text-sm font-semibold body-font' onClick={() => handleComingSoon("Why Us")}>Why Us</li>
                    <li className='text-sm font-semibold body-font' onClick={() => handleComingSoon("FAQ")}>FAQ</li>
                    <li className='text-sm font-semibold body-font'>
                      <button 
                        onClick={() => router.push('/login')} 
                        className='bg-black cursor-pointer text-white px-5 py-2 rounded-full'
                      >
                        Get Started
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </nav>
          </div>

          <div className='md:hidden'>
            <div className=' flex justify-between font-black items-center gap-40 px-6 py-5'>
              <h2 className='text-2xl font-bold heading-font'>QuickReply</h2>

              <button onClick={() => setmenuOpen(!menuOpen)}>
                {menuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>

            {menuOpen && (
              <div className={`md:hidden overflow-hidden bg-white transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100" : 'max-h-0 opacity-0'}`}>
                <div className='bg-white rounded-2xl mx-3 p-3'>
                  <ul className='flex flex-col gap-5 text-lg font-medium'>
                    <li> <a href='#home' className='text-sm font-semibold body-font'>Home</a></li>
                    <li> <a href='#capabilities' className='text-sm font-semibold body-font'>Capabilities</a></li>
                    <li> <button onClick={() => handleComingSoon("About Us")} className='text-sm font-semibold body-font'>About Us</button></li>
                    <li> <button onClick={() => handleComingSoon("Why Us")} className='text-sm font-semibold body-font'>Why Us</button></li>
                    <li> <button onClick={() => handleComingSoon("FAQ")} className='text-sm font-semibold body-font'>FAQ</button></li>
                    <li>
                      <button 
                        onClick={() => router.push('/login')}
                        className='bg-black cursor-pointer text-white px-5 py-2 rounded-full'
                      >
                        Get Started
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div >

<<<<<<< HEAD:src/app/page.tsx
          <div className='herosection grid grid-cols-1 md:grid-cols-2 gap-20 items-center px-10 py-16'>
=======

          <div className='herosection grid grid-cols-1  md:grid-cols-2 gap-20 items-center px-10 py-16'>
>>>>>>> 5662598927237ef1c9eeb960ffa38d913bab6aff:src/App.jsx
            <div className='left-div flex flex-col gap-6'>
              <h1 className='heading-font text-4xl font-bold italic text-zinc-900 leading-none'>Meet QuickReply !</h1>
              <p className='text-lg text-zinc-900 leading-6 max-w-xl body-font'>
                Automate YouTube comment replies with customisable keyword rules. Save time, engage your audience instantly, and never miss repitive questions again.
              </p>
            </div>

            <div className='right-div'>
              <img src="/younggirl.jpg" alt="younggirl" className='w-[500px] rounded-3xl' />
            </div>
          </div>
        </div >

        <section id='home' className='py-20 px-10'>
          <div className='text-center mb-5 mt-10'>
            <h1 className='text-zinc-900 heading-font text-4xl font-bold italic'>How it works?</h1>
          </div>
          <p className='text-black-600 mt-4 max-w-2xl mx-auto text-center body-font'>Save hours every week by automatically replying to comments using customisable keyword rules</p>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 max-w-5xl mx-auto'>
            <div className="rounded-3xl shadow-lg p-8 bg-white">
              <h3 className='text-2xl font-semibold mb-3 heading-font italic'> Auto Replies</h3>
              <p className='text-gray-600 leading-5 body-font'>
                Automatically reply to repitive comments like "Notes?", "Link?", "Github?"
              </p>
            </div>

            <div className="rounded-3xl shadow-lg p-8 bg-white">
              <h3 className='text-2xl font-semibold mb-3 heading-font italic'> Keyword Rules</h3>
              <p className='text-gray-600 leading-5 body-font'>
                Create your own trigger words and customise the reply that should be sent automatically.
              </p >
            </div>

            <div className="rounded-3xl shadow-lg p-8 bg-white">
              <h3 className='text-2xl font-semibold mb-3 heading-font italic'> Instant Responses</h3>
              <p className='text-gray-600 leading-5 body-font'>
                Keep your audience engaged with quick response instead of replying manually.
              </p >
            </div>

            <div className="rounded-3xl shadow-lg p-8 bg-white">
              <h3 className='text-2xl font-semibold mb-3 heading-font italic'>Creator freindly</h3>
              <p className='text-gray-600 leading-5 body-font'>
                Perfect for creators who recieve hundreds of similar comments everyday.
              </p >
            </div>
          </div>
        </section >

        <section id='capabilities' className='py-20 px-10'>
          <div className='text-center mb-5'>
            <h1 className='text-zinc-900 heading-font text-4xl font-bold italic'>It's capabilites?</h1>
            <p className='text-black-600 mt-4 max-w-2xl mx-auto text-center body-font'>Everything you need to automate YouTube comments and engage your audience effortlessly.</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 max-w-7xl mx-auto'>
            <div className='rounded-3xl bg-[#171717] text-white p-8 hover:scale-100 transition-all duration-300 cursor-pointer'>
              <MessageCircle size={40} />
              <h1 className='text-2xl font-semibold mt-6 heading-font italic'>Auto <br className='hidden lg:block' /> Replies</h1>
              <p className='mt-5 text-gray-200 leading-5 body-font'>Automatically reply to repititive YouTube comments without manual effort.
              </p>
            </div>

            <div className='rounded-3xl bg-[#DFF8FF] text-black p-8 hover:scale-100 transition-all duration-300 cursor-pointer'>
              <Bot size={40} />
              <h1 className='text-2xl font-semibold mt-6 heading-font italic'>Keyword Rules</h1>
              <p className='mt-5 text-black-200 leading-5 body-font'>Create custom trigger words and customise replies for every situation.
              </p>
            </div>

            <div className='rounded-3xl bg-white text-black p-8 hover:scale-100 transition-all duration-300 cursor-pointer'>
              <Zap size={40} />
              <h1 className='text-2xl font-semibold mt-6 heading-font italic'>Instant Responses</h1>
              <p className='mt-5 text-black-200 leading-5 body-font'>Respond to viewers within seconds and keep your audience engaged.
              </p>
            </div>

            <div className='rounded-3xl bg-[#F59E0B] text-white p-8 hover:scale-100 transition-all duration-300 cursor-pointer'>
              <Clock3 size={40} />
              <h1 className='text-2xl font-semibold mt-6 heading-font italic'>Save <br className='hidden lg:block' />hours</h1>
              <p className='mt-5 text-white leading-5 body-font'>Save your time while focusing on creating better content.
              </p>
            </div>
          </div>
        </section>

        <section id='faq' className='faq py-20 px-10'>
          <h1 className='text-zinc-900 heading-font text-4xl font-bold italic text-center mb-10'>FAQ's</h1>
          <div className='bg-white rounded-2xl shadow-sm mb-4 p-4 hover:shadow-md transition-all max-w-4xl mx-auto'>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className='border-b border-gray-200 py-5 cursor-pointer'
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div className='flex justify-between items-center'>
                  <h3 className='text-lg font-semibold body-font'> {faq.question}</h3>
                  <span className='text-2xl'>
                    {openIndex === index ? "-" : "+"}
                  </span>
                </div>
                {openIndex === index && (
                  <p className='mt-4 text-gray-600 leading-7 body-font'>
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer className='bg-black py-8 px-2'>
          <div className='max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 px-10 text-white'>
            <div className='flex flex-col gap-3'>
              <h2 className='text-3xl font-bold text-white heading-font mb-4'>QuickReply</h2>
              <p className='text-white text-sm body-font'>
                Automate YouTube comment replies and save hours every week.
              </p>
              <div className='flex justify-between items-center gap-4 text-white mt-8'>
                <h1 className='text-sm cursor-pointer body-font'>Twitter</h1>
                <h1 className='text-sm cursor-pointer body-font'>Linkedin</h1>
                <h1 className='text-sm cursor-pointer body-font'>Instagram</h1>
              </div>
            </div>

            <div>
              <h3 className='font-bold text-lg'>Product</h3>
              <ul className='space-y-4 mt-6 text-white'>
                <li className='text-sm cursor-pointer body-font'>Features</li>
                <li className='text-sm cursor-pointer body-font' onClick={() => handleComingSoon("FAQ")}>FAQ</li>
                <li className='text-sm cursor-pointer body-font'>Documentation</li>
              </ul>
            </div>

            <div>
              <h3 className='font-bold text-lg'>Company</h3>
              <ul className='space-y-4 mt-6 text-white'>
                <li className='text-sm cursor-pointer body-font' onClick={() => handleComingSoon("About Us")}>About Us</li>
                <li className='text-sm cursor-pointer body-font' onClick={() => handleComingSoon("Why Us")}>Why Us</li>
                <li className='text-sm cursor-pointer body-font'>Contact Us</li>
              </ul>
            </div>
          </div>
        </footer>
      </div >

      {comingSoonTitle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform transition-all text-center relative border border-gray-100">
            <button 
              onClick={() => setComingSoonTitle("")}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock3 size={32} />
            </div>
            <h3 className="text-2xl font-bold heading-font text-zinc-900 mb-2">Coming Soon!</h3>
            <p className="text-gray-600 body-font">
              We're working hard to launch the <strong>{comingSoonTitle}</strong> page. Stay tuned for updates!
            </p>
            <button 
              onClick={() => setComingSoonTitle("")}
              className="mt-8 bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors w-full cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
