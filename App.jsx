import { useState } from 'react';
import { Camera, Upload, Award, Trash2, X } from 'lucide-react';

const DISHES = ['Pizza', 'Pasta', 'Salad Bar', 'Burger', 'Chicken Tenders', 'Tacos', 'Soup', 'Stir Fry', 'Sandwich', 'Mac & Cheese'];

export default function App() {
  const [activeTab, setActiveTab] = useState('scan');
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

  const classifyWaste = (wastePercent) => {
    if (wastePercent <= 0.1) return 'None';
    if (wastePercent <= 0.25) return 'Minimal';
    if (wastePercent <= 0.4) return 'Moderate';
    if (wastePercent <= 0.6) return 'Significant';
    return 'Most Left';
  };

  const analyzeImage = () => {
    if (!uploadedImage || !selectedDish) {
      alert('Please select a dish and upload an image');
      return;
    }

    setIsAnalyzing(true);

    // Simulate analysis delay
    setTimeout(() => {
      const wastePercent = Math.random() * 0.5 + 0.05;
      const wasteLevel = classifyWaste(wastePercent);
      
      const points = wasteLevel === 'None' ? 15 : wasteLevel === 'Minimal' ? 10 : wasteLevel === 'Moderate' ? 5 : wasteLevel === 'Significant' ? 2 : 1;
      
      const tips = [];
      if (wasteLevel === 'Significant' || wasteLevel === 'Most Left') {
        tips.push('Try taking smaller portions next time');
        tips.push('You can always go back for seconds!');
      } else if (wasteLevel === 'None') {
        tips.push('Amazing job! You\'re a SmartPlate champion! 🏆');
      }

      const result = { 
        dish: selectedDish, 
        waste: wasteLevel, 
        wastePercent: (wastePercent * 100).toFixed(1),
        points, 
        tips,
        impact: {
          weight: (wastePercent * 0.5).toFixed(3),
          cost: (wastePercent * 3.50).toFixed(2),
          co2: (wastePercent * 1.2).toFixed(2)
        }
      };
      
      setAnalysisResult(result);
      setUserPoints(prev => prev + points);
      setRecentScans(prev => [
        { 
          id: Date.now(), 
          dish: selectedDish, 
          waste: wasteLevel, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
          points 
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
        <div className="space-y-6">
          {/* Scanner Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Scan Your Tray</h2>

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

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Upload photo of leftovers</label>
                  <label className="block cursor-pointer">
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      uploadedImage ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'
                    }`}>
                      {uploadedImage ? (
                        <div className="space-y-3">
                          <img src={uploadedImage} alt="Uploaded" className="w-full h-40 object-cover rounded-lg mx-auto" />
                          <p className="text-sm text-emerald-600 font-medium">Photo uploaded ✓</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload size={32} className="mx-auto text-gray-400" />
                          <p className="text-gray-700 font-medium">Click to upload photo</p>
                          <p className="text-xs text-gray-500">or drag and drop</p>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
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
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                  analysisResult.waste === 'None' ? 'bg-emerald-100' :
                  analysisResult.waste === 'Minimal' ? 'bg-teal-100' :
                  analysisResult.waste === 'Moderate' ? 'bg-amber-100' : 'bg-red-100'
                }`}>
                  {analysisResult.waste === 'None' ? (
                    <Award size={40} className="text-emerald-600" />
                  ) : (
                    <Trash2 size={40} className={
                      analysisResult.waste === 'Minimal' ? 'text-teal-600' :
                      analysisResult.waste === 'Moderate' ? 'text-amber-600' : 'text-red-500'
                    } />
                  )}
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

                {analysisResult.tips.length > 0 && (
                  <div className={`p-4 rounded-xl text-left ${analysisResult.waste === 'None' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    {analysisResult.tips.map((tip, i) => (
                      <p key={i} className={`text-sm ${analysisResult.waste === 'None' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {analysisResult.waste === 'None' ? '🎉' : '💡'} {tip}
                      </p>
                    ))}
                  </div>
                )}

                <button
                  onClick={resetScan}
                  className="w-full py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Scan Another Tray
                </button>
              </div>
            )}
          </div>

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
      </div>
    </div>
  );
}
