import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import younggirl from './assets/younggirl.jpg'
import { Clock3, MessageCircle, Zap } from 'lucide-react'
import { Bot } from 'lucide-react'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='bg-amber-100'>
        <div className='bg-yellow-300 rounded-3xl m-1.5 w-[97vw] h-[97.5vh]'>
          <div className='w-full flex justify-center pt-8'>
            <nav className='navbar bg-white rounded-full p-2 px-4 shadow-lg 
          '>
              <ul className='flex gap-16 w-full items-center'>
                <li>Home</li>
                <li>About</li>
                <li>Contact</li>
                <li>
                  <button className='bg-black text-white px-5 py-2 rounded-full'>Get Started</button>

                </li>
              </ul>
            </nav>
          </div>



          <div className='herosection grid grid-cols-2 gap-20 items-center px-10 py-16'>
            <div className='left-div flex flex-col gap-6'>
              <h1 className='heading-font text-4xl font-bold italic text-zinc-900 leading-none' >Meet QuickReply !</h1>
              <p className='text-lg text-zinc-900 leading-6 max-w-xl'>
                Automate YouTube comment replies with customisable keyword rules. Save time, engage your audience instantly, and never miss repitive questions again.


              </p>
            </div>


            <div className='right-div'>

              <img src={younggirl} alt="younggirl" className='w-[500px] rounded-3xl' />
            </div>


          </div>
        </div >




        <section className='py-20 px-10'>

          <div className='text-center mb-5'>
            <h1 className='text-zinc-900 heading-font text-4xl font-bold italic'>How it works?</h1>
          </div>

          <p className='text-black-600 mt-4 max-w-2xl mx-auto text-center'>Save hours every week by automatically replying to comments using customisable keyword rules</p>


          <div className='grid grid-cols-2 gap-8 mt-10'>

            <div className="rounded-3xl shadow-lg p-8 bg-white">
              <h3 className='text-2xl font-semibold mb-3 heading-font italic'> Auto Replies</h3>
              <p className='text-gray-600 leading-5'>
                Automatically reply to repitive comments like "Notes?", "Link?", "Github?"
              </p>
            </div>


            <div className="rounded-3xl shadow-lg p-8 bg-white">
              <h3 className='text-2xl font-semibold mb-3 heading-font italic'> Keyword Rules</h3>
              <p className='text-gray-600 leading-5'>
                Create your own trigger words and customise the reply that should be sent automatically.
              </p >
            </div>


            <div className="rounded-3xl shadow-lg p-8 bg-white">
              <h3 className='text-2xl font-semibold mb-3 heading-font italic'> Instant Responses</h3>
              <p className='text-gray-600 leading-5'>
                Keep your audience engaged with quick response instead of replying manually.
              </p >
            </div>


            <div className="rounded-3xl shadow-lg p-8 bg-white">
              <h3 className='text-2xl font-semibold mb-3 heading-font italic'>Creator freindly</h3>
              <p className='text-gray-600 leading-5'>
                Perfect for creators who recieve hundreds of similar comments everyday.
              </p >
            </div>

          </div>
        </section >


        <section className='py-20 px-10'>

          <div className='text-center mb-5'>
            <h1 className='text-zinc-900 heading-font text-4xl font-bold italic'>It's capabilites?</h1>
            <p className='text-black-600 mt-4 max-w-2xl mx-auto text-center'>Everything you need to automate YouTube comments and engage your audience effortlessly.</p>
          </div>



          <div className='grid grid-cols-4 gap-4 mt-10'>

            <div className='rounded-3xl bg-[#171717] text-white p-8 hover:scale-100 transition-all duration-300 cursor-pointer'>
              <MessageCircle size={40} />

              <h1 className='text-2xl font-semibold mt-6 heading-font italic'>Auto Replies</h1>
              <p className='mt-5 text-gray-200 leading-5'>Automatically reply to repititive YouTube comments without manual effort.
              </p>
            </div>


            <div className='rounded-3xl bg-[#DFF8FF] text-black p-8 hover:scale-100 transition-all duration-300 cursor-pointer'>
              <Bot size={40} />

              <h1 className='text-2xl font-semibold mt-6 heading-font italic'>Keyword Rules</h1>
              <p className='mt-5 text-black-200 leading-5'>Create your own trigger words and customise replies for every situation.
              </p>
            </div>



            <div className='rounded-3xl bg-white text-black p-8 hover:scale-100 transition-all duration-300 cursor-pointer'>
              <Zap size={40} />

              <h1 className='text-2xl font-semibold mt-6 heading-font italic'>Instant Responses</h1>
              <p className='mt-5 text-black-200 leading-5'>Respond to viewers within seconds and imporve engagement on every upload.
              </p>
            </div>



            <div className='rounded-3xl bg-[#F59E0B] text-white p-8 hover:scale-100 transition-all duration-300 cursor-pointer'>
              <Clock3 size={40} />

              <h1 className='text-2xl font-semibold mt-6 heading-font italic'>Save hours</h1>
              <p className='mt-5 text-gray-200 leading-5'>Let QuickReply handle repitive replies while you focus on creating content.
              </p>
            </div>

          </div>


        </section>





      </div>
    </>
  )
}

export default App
