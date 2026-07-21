import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import younggirl from './assets/younggirl.jpg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='bg-yellow-300 rounded-3xl m-2 w-[98vw] h-[97vh]'>
        <div className='w-full flex justify-center pt-8'>
          <nav className='navbar bg-white rounded-full p-2 shadow-lg'>
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
          <div className='left-div flex flex-col gap-8'>
            <h1 className='text-4xl font-bold text-zinc-900 leading-none'>Meet QuickReply !</h1>
            <p className='text-lg text-zinc-700 leading-7 max-w-xl'>
              Automate YouTube comment replies with customisable keyword rules. Save time, engage your audience instantly, and never miss repitive questions again.


            </p>
          </div>


          <div className='right-div'>

            <img src={younggirl} alt="younggirl" className='w-[500px] rounded-3xl' />
          </div>


        </div>
      </div >

    </>
  )
}

export default App
