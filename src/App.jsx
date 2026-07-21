import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='bg-yellow-300 rounded-sm w-full h-screen'>
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



        <div className=''>


        </div>



      </div >

    </>
  )
}

export default App
