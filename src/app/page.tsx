export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-racing-gray-50 to-racing-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-racing-gray-900 mb-4">
            Should I Race This?
          </h1>
          <p className="text-xl text-racing-gray-600 mb-8">
            Data-driven racing recommendations for iRacing competitors
          </p>
          <div className="racing-gradient h-1 w-24 mx-auto rounded-full"></div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-12 h-12 bg-racing-blue rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold">📊</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
            <p className="text-racing-gray-600">
              Analyze your historical race performance across series and tracks
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-racing-green rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold">🎯</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Recommendations</h3>
            <p className="text-racing-gray-600">
              Get personalized race recommendations based on your goals
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-racing-red rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold">🏁</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">iRacing Integration</h3>
            <p className="text-racing-gray-600">
              Seamlessly connect with your iRacing account and data
            </p>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <button className="btn-primary text-lg px-8 py-3">
            Login with iRacing
          </button>
        </div>
      </div>
    </main>
  );
}