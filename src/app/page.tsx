'use client';

import { useAuth } from '@/lib/auth/hooks';
import Image from 'next/image';
import { Check, BarChart3, Search, LogOut } from 'lucide-react';
import { IRacingLoginButton } from '@/components/ui/iracing-login-button';

export default function Home() {
  const { user, loading, login, logout } = useAuth();

  const handleLogin = () => {
    login();
  };

  const handleTestMe = async () => {
    window.open('/api/auth/me', '_blank');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-racing-gray-50 to-racing-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-racing-red mx-auto mb-4"></div>
          <p className="text-racing-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  // Show success state if user is authenticated
  if (user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-racing-gray-50 to-racing-gray-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-racing-green rounded-full mx-auto mb-6 flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-racing-gray-900 mb-4">
              Welcome to the Track!
            </h1>
            <p className="text-xl text-racing-gray-600 mb-8">
              Your iRacing account is now connected. Ready to analyze your racing data?
            </p>
            
            {user && (
              <div className="card max-w-md mx-auto mb-8">
                <h3 className="text-lg font-semibold mb-4 text-racing-gray-900">Driver Profile</h3>
                <div className="text-left space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-racing-gray-600">Driver:</span>
                    <span className="font-semibold text-racing-gray-900">{user.displayName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-racing-gray-600">iRacing ID:</span>
                    <span className="font-mono text-racing-blue">{user.iracingCustomerId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-racing-gray-600">License Classes:</span>
                    <span className="font-semibold text-racing-green">{user.licenseClasses.length}</span>
                  </div>
                  {user.licenseClasses.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-racing-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {user.licenseClasses.map((license, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="capitalize text-racing-gray-600">{license.category}:</span>
                            <span className="font-semibold text-racing-gray-900">{license.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="btn-primary text-lg px-8 py-3 inline-flex items-center gap-2 hover:scale-105 transform transition-all duration-200"
                >
                  <BarChart3 className="w-5 h-5" />
                  View Analytics Dashboard
                </button>
                
                <button 
                  onClick={handleTestMe}
                  className="btn-secondary text-lg px-8 py-3 inline-flex items-center gap-2 hover:scale-105 transform transition-all duration-200"
                >
                  <Search className="w-5 h-5" />
                  Test API Connection
                </button>
              </div>
              
              <button 
                onClick={logout}
                className="btn-secondary text-lg px-6 py-2 inline-flex items-center gap-2 hover:scale-105 transform transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
            
            <p className="text-sm text-racing-gray-500 mt-6">
              Test the API connection to validate your authentication
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-racing-black via-racing-gray-900 to-racing-gray-800 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="racing-gradient h-2 w-32 mx-auto rounded-full mb-4"></div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-racing-gray-100 to-white bg-clip-text text-transparent">
              Should I Race This?
            </h1>
            <div className="racing-gradient h-2 w-32 mx-auto rounded-full"></div>
          </div>
          
          <p className="text-xl md:text-2xl text-racing-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Make smarter racing decisions with data-driven insights. Analyze your performance, 
            understand your strengths, and get personalized recommendations to improve your 
            <span className="text-racing-blue font-semibold"> iRating</span> and 
            <span className="text-racing-green font-semibold"> Safety Rating</span>.
          </p>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-racing-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-racing-gray-700 hover:border-racing-blue/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-br from-racing-blue to-racing-blue/80 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-4 text-center">Performance Analytics</h3>
            <p className="text-racing-gray-300 text-center leading-relaxed">
              Deep dive into your racing history. See where you excel and where you struggle 
              across different series, tracks, and session types.
            </p>
          </div>
          
          <div className="bg-racing-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-racing-gray-700 hover:border-racing-green/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-br from-racing-green to-racing-green/80 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-4 text-center">Smart Recommendations</h3>
            <p className="text-racing-gray-300 text-center leading-relaxed">
              Get AI-powered race recommendations tailored to your goals. Whether you&apos;re pushing 
              for iRating gains or focusing on safety, we&apos;ve got you covered.
            </p>
          </div>
          
          <div className="bg-racing-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-racing-gray-700 hover:border-racing-red/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-br from-racing-red to-racing-red/80 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-4 text-center">Secure iRacing Integration</h3>
            <p className="text-racing-gray-300 text-center leading-relaxed">
              Seamlessly and securely connect with your iRacing account using OAuth2. 
              Your data stays private and is never shared with third parties.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-12 text-white">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-racing-blue rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">1</div>
              <h4 className="font-semibold mb-2">Connect</h4>
              <p className="text-sm text-racing-gray-400">Link your iRacing account securely</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-racing-green rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">2</div>
              <h4 className="font-semibold mb-2">Analyze</h4>
              <p className="text-sm text-racing-gray-400">We analyze your racing history</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-racing-yellow rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">3</div>
              <h4 className="font-semibold mb-2">Recommend</h4>
              <p className="text-sm text-racing-gray-400">Get personalized race suggestions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-racing-red rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">4</div>
              <h4 className="font-semibold mb-2">Improve</h4>
              <p className="text-sm text-racing-gray-400">Make data-driven racing decisions</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-racing-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-racing-gray-700 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Race Smarter?</h3>
            <p className="text-racing-gray-300 mb-8">
              Connect your iRacing account and start making data-driven decisions about which races to join.
            </p>
            
            {/* Login Button */}
            <IRacingLoginButton 
              onClick={handleLogin}
              className="mx-auto"
              size="lg"
            />
            
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-racing-gray-400">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-racing-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Secure OAuth2
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-racing-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No Data Sharing
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-racing-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Always Free
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}