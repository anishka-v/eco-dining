import { useState } from 'react';
import { Upload, Award, Trash2 } from 'lucide-react';

const DISHES = ['Pizza', 'Pasta', 'Salad Bar', 'Burger', 'Chicken Tenders', 'Tacos', 'Soup', 'Stir Fry', 'Sandwich', 'Mac & Cheese'];

export default function App() {
  const [showScanner, setShowScanner] = useState(false);
  const [selectedDish, setSelectedDish] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userPoints, setUserPoints] = useState(847);
  const [recentScans, setRecentScans] = useState([
    { id: 1, dish: 'Pizza', waste: 'Minimal', time: '12:34 PM', points: 10 },
    { id: 2, dish: 'Salad Bar', waste: 'None', time: '12:15 PM', points: 15 },
    { id: 3, dish: 'Burger', waste: 'Moderate', time: '11:58 AM', points: 5 },
  ]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = () => {
    if (!uploadedImage || !selectedDish) {
      alert('Please select a dish and upload an image');
      return;
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      const result = { 
        dish: selectedDish, 
        waste: 'Moderate', 
        wastePercent: '35',
        points: 5,
        tips: [
          '💡 Try taking a smaller portion next time',
          '💡 You can always go back for seconds!'
        ],
        impact: {
          weight: '0.175',
          cost: '1.23',
          co2: '0.35'
        }
      };
      
      setAnalysisResult(result);
      setUserPoints(prev => prev + 5);
      setRecentScans(prev => [
        { 
          id: Date.now(), 
          dish: selectedDish, 
          waste: 'Moderate', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
          points: 5
        }, 
        ...prev.slice(0, 9)
      ]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const resetScan = () => {
    setUploadedImage(null);
    setSelectedDish('');
    setAnalysisResult(null);
  };

  const closeScan = () => {
    setShowScanner(false);
    resetScan();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between py-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">🌿 EcoDining</h1>
            <p className="text-sm text-emerald-600">Reduce waste. Earn rewards.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <Award className="text-amber-500" size={20} />
            <span className="font-bold text-gray-800">{userPoints}</span>
            <span className="text-xs text-gray-500">pts</span>
          </div>
        </header>

        {/* Main Content */}
        {!showScanner ? (
          <div className="space-y-6">
            {/* Scan Button */}
            <button
              onClick={() => setShowScanner(true)}
              className="w-full py-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Upload size={32} />
              </div>
              <span>Scan Your Tray</span>
              <span className="text-sm opacity-80">Earn points & reduce waste</span>
            </button>

            {/* Recent Scans */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Scans</h3>
              {recentScans.length === 0 ? (
                <p className="text-center text-gray-400 py-6">No scans yet today</p>
              ) : (
                <div className="space-y-2">
                  {recentScans.map(scan => (
                    <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800">{scan.dish}</p>
                        <p className="text-xs text-gray-500">{scan.time}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          scan.waste === 'None' ? 'text-emerald-600' :
                          scan.waste === 'Minimal' ? 'text-teal-600' :
                          scan.waste === 'Moderate' ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {scan.waste}
                        </p>
                        <p className="text-xs text-amber-600">+{scan.points} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Scanner Screen */
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Scan Your Tray</h2>
              <button
                onClick={closeScan}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {!analysisResult ? (
              <div className="space-y-6">
                {/* Dish Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">What did you eat?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DISHES.map(dish => (
                      <button
                        key={dish}
                        onClick={() => setSelectedDish(dish)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          selectedDish === dish
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {dish}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drag & Drop Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Upload leftovers photo</label>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                      uploadedImage ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    <label className="block cursor-pointer">
                      {uploadedImage ? (
                        <div className="space-y-3">
                          <img src={uploadedImage} alt="Uploaded" className="w-full h-40 object-cover rounded-lg mx-auto" />
                          <p className="text-sm text-emerald-600 font-medium">✓ Photo uploaded</p>
                          <p className="text-xs text-gray-500">Click to change image</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload size={32} className="mx-auto text-gray-400" />
                          <p className="text-gray-700 font-medium">Drag image here or click</p>
                          <p className="text-xs text-gray-500">JPG, PNG supported</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Analyze Button */}
                <button
                  onClick={analyzeImage}
                  disabled={!uploadedImage || !selectedDish || isAnalyzing}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isAnalyzing
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : uploadedImage && selectedDish
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze Waste'
                  )}
                </button>
              </div>
            ) : (
              /* Results */
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-amber-100">
                  <Trash2 size={40} className="text-amber-600" />
                </div>

                <div>
                  <p className="text-3xl font-bold text-gray-800">{analysisResult.waste} Waste</p>
                  <p className="text-sm text-gray-500">{analysisResult.wastePercent}% of portion</p>
                  <p className="text-lg font-semibold text-amber-600 mt-2">+{analysisResult.points} points! 🎉</p>
                </div>

                <img src={uploadedImage} alt="Result" className="w-full h-40 object-cover rounded-xl mx-auto" />

                <div className="grid grid-cols-3 gap-3 bg-blue-50 p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-600">Weight Wasted</p>
                    <p className="font-bold text-gray-800">{analysisResult.impact.weight} lbs</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Cost</p>
                    <p className="font-bold text-gray-800">${analysisResult.impact.cost}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">CO2 Prevented</p>
                    <p className="font-bold text-gray-800">{analysisResult.impact.co2} kg</p>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl text-left">
                  {analysisResult.tips.map((tip, i) => (
                    <p key={i} className="text-sm text-amber-700">
                      {tip}
                    </p>
                  ))}
                </div>

                <button
                  onClick={resetScan}
                  className="w-full py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Scan Another Tray
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
