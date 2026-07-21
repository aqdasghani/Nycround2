import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className='flex h-screen bg-gray-50 font-sans'>
      {/* Sidebar */}
      <aside className='w-64 bg-white border-r border-gray-200 flex flex-col'>
        <div className='p-6 flex items-center justify-center border-b border-gray-200'>
          <h1 className='text-2xl font-bold text-gray-900'>QuickReply</h1>
        </div>
        
        <nav className='flex-1 p-4 flex flex-col gap-2'>
          <button className='flex items-center gap-3 w-full px-4 py-3 bg-yellow-100 text-yellow-800 rounded-lg font-medium'>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Overview
          </button>
          
          <button className='flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors'>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            Auto Replies
          </button>
          
          <button className='flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors'>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Analytics
          </button>
        </nav>

        <div className='p-4 border-t border-gray-200'>
          <button 
            onClick={handleLogout}
            className='flex items-center justify-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors cursor-pointer'
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 flex flex-col h-screen overflow-hidden'>
        {/* Header */}
        <header className='h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0'>
          <h2 className='text-xl font-semibold text-gray-800'>Overview</h2>
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center text-yellow-800 font-bold'>
              U
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className='p-8 overflow-y-auto flex-1'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            {/* Stat Cards */}
            <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2'>
              <span className='text-gray-500 font-medium'>Total Comments</span>
              <span className='text-3xl font-bold text-gray-900'>1,248</span>
            </div>
            <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2'>
              <span className='text-gray-500 font-medium'>Auto Replies Sent</span>
              <span className='text-3xl font-bold text-gray-900'>892</span>
            </div>
            <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2'>
              <span className='text-gray-500 font-medium'>Time Saved</span>
              <span className='text-3xl font-bold text-gray-900'>14 hrs</span>
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>Recent Activity</h3>
            <div className='flex flex-col gap-4'>
              <div className='flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100'>
                <div className='w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-500'>👤</div>
                <div className='flex-1'>
                  <p className='text-gray-800 font-medium'>User asked about pricing</p>
                  <p className='text-gray-500 text-sm'>Replied automatically using "Pricing Rule"</p>
                </div>
                <span className='text-gray-400 text-sm'>2 mins ago</span>
              </div>
              
              <div className='flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100'>
                <div className='w-10 h-10 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-500'>👤</div>
                <div className='flex-1'>
                  <p className='text-gray-800 font-medium'>Awesome video!</p>
                  <p className='text-gray-500 text-sm'>Replied automatically using "Thank You Rule"</p>
                </div>
                <span className='text-gray-400 text-sm'>15 mins ago</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
