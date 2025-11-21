import { useState } from 'react';
import { Camera, TrendingDown, TrendingUp, BarChart3, Utensils, Leaf, AlertTriangle, ChevronRight, X, Upload, Trash2, Award, Calendar, PieChart, Lightbulb, ArrowDown, ArrowUp } from 'lucide-react';

const DISHES = ['Pizza', 'Pasta', 'Salad Bar', 'Burger', 'Chicken Tenders', 'Tacos', 'Soup', 'Stir Fry', 'Sandwich', 'Mac & Cheese'];
const WASTE_LEVELS = ['None', 'Minimal', 'Moderate', 'Significant', 'Most Left'];

const generateMockData = () => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayData = {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date,
      totalTrays: Math.floor(Math.random() * 200) + 300,
      wastePercent: Math.max(8, Math.min(35, 25 - i * 0.3 + Math.random() * 10)),
      dishes: {}
    };
    DISHES.forEach(dish => {
      dayData.dishes[dish] = {
        served: Math.floor(Math.random() * 80) + 20,
        wastePercent: Math.random() * 40 + 5
      };
    });
    data.push(dayData);
  }
  return data;
};

const mockData = generateMockData();

const insights = [
  { type: 'alert', icon: AlertTriangle, color: 'red', title: 'High Waste Alert', text: 'Mac & Cheese waste up 23% this week. Consider reducing portion size from 8oz to 6oz.' },
  { type: 'success', icon: TrendingDown, color: 'green', title: 'Improvement Detected', text: 'Salad Bar waste down 15% since adding smaller plate option.' },
  { type: 'tip', icon: Lightbulb, color: 'amber', title: 'Recommendation', text: 'Taco Tuesday shows 40% less waste than other days. Consider expanding Mexican options.' },
  { type: 'info', icon: Leaf, color: 'emerald', title: 'Impact Update', text: 'This month: 847 lbs food saved = 1,270 meals rescued = $2,541 saved.' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCapture, setShowCapture] = useState(false);
  const [captureStep, setCaptureStep] = useState('before');
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [selectedDish, setSelectedDish] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [recentScans, setRecentScans] = useState([
    { id: 1, dish: 'Pizza', waste: 'Minimal', time: '12:34 PM', points: 10 },
    { id: 2, dish: 'Salad Bar', waste: 'None', time: '12:15 PM', points: 15 },
    { id: 3, dish: 'Burger', waste: 'Moderate', time: '11:58 AM', points: 5 },
  ]);
  const [userPoints, setUserPoints] = useState(847);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const periodData = selectedPeriod === 'week' ? mockData.slice(-7) : selectedPeriod === 'month' ? mockData : mockData.slice(-1);
  const avgWaste = periodData.reduce((a, b) => a + b.wastePercent, 0) / periodData.length;
  const totalTrays = periodData.reduce((a, b) => a + b.totalTrays, 0);
  const wasteChange = periodData.length > 1 ? periodData[periodData.length - 1].wastePercent - periodData[0].wastePercent : 0;

  const dishStats = DISHES.map(dish => {
    const total = periodData.reduce((a, d) => a + (d.dishes[dish]?.wastePercent || 0), 0);
    return { name: dish, wastePercent: total / periodData.length };
  }).sort((a, b) => b.wastePercent - a.wastePercent);

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'before') setBeforeImage(reader.result);
        else setAfterImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeWaste = () => {
    const wasteLevel = WASTE_LEVELS[Math.floor(Math.random() * 5)];
    const points = wasteLevel === 'None' ? 15 : wasteLevel === 'Minimal' ? 10 : wasteLevel === 'Moderate' ? 5 : 2;
    const result = { dish: selectedDish, waste: wasteLevel, points, tips: [] };
    
    if (wasteLevel === 'Significant' || wasteLevel === 'Most Left') {
      result.tips = ['Try taking smaller portions', 'You can always go back for seconds!', 'Consider trying the half-portion option'];
    } else if (wasteLevel === 'None') {
      result.tips = ['Amazing job! You\'re a SmartPlate champion! 🏆'];
    }
    
    setAnalysisResult(result);
    setUserPoints(prev => prev + points);
    setRecentScans(prev => [{ id: Date.now(), dish: selectedDish, waste: wasteLevel, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), points }, ...prev.slice(0, 9)]);
  };

  const resetCapture = () => {
    setShowCapture(false);
    setCaptureStep('before');
    setBeforeImage(null);
    setAfterImage(null);
    setSelectedDish('');
    setAnalysisResult(null);
  };

  const WasteBar = ({ percent, height = 'h-24' }) => (
    <div className={`w-full ${height} bg-gray-100 rounded-lg overflow-hidden flex flex-col-reverse`}>
      <div 
        className={`w-full transition-all duration-500 ${percent > 30 ? 'bg-red-400' : percent > 20 ? 'bg-amber-400' : 'bg-emerald-400'}`}
        style={{ height: `${percent}%` }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-4xl mx-auto p-4">
        <header className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-800">🌿 EcoDining</h1>
            <p className="text-sm text-emerald-600">Reduce waste. Save food. Earn rewards.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <Award className="text-amber-500" size={20} />
            <span className="font-bold text-gray-800">{userPoints}</span>
            <span className="text-xs text-gray-500">pts</span>
          </div>
        </header>

        <div className="flex gap-2 mb-6 bg-white/60 p-1 rounded-xl">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'scan', label: 'Scan Tray', icon: Camera },
            { id: 'insights', label: 'Insights', icon: Lightbulb },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              {['today', 'week', 'month'].map(p => (
                <button key={p} onClick={() => setSelectedPeriod(p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedPeriod === p ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-emerald-50'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Avg Waste</p>
                <p className="text-2xl font-bold text-gray-800">{avgWaste.toFixed(1)}%</p>
                <div className={`flex items-center gap-1 text-xs mt-1 ${wasteChange < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {wasteChange < 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                  {Math.abs(wasteChange).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Trays Scanned</p>
                <p className="text-2xl font-bold text-gray-800">{totalTrays.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 mt-1">+12% participation</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Food Saved</p>
                <p className="text-2xl font-bold text-emerald-600">{Math.floor(totalTrays * 0.15)} lbs</p>
                <p className="text-xs text-gray-500 mt-1">≈ ${(totalTrays * 0.15 * 3).toFixed(0)} saved</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Waste Trend</h3>
              <div className="flex items-end gap-1 h-32">
                {periodData.slice(-14).map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-100 rounded-t flex-1 flex flex-col-reverse overflow-hidden">
                      <div 
                        className={`w-full transition-all ${d.wastePercent > 30 ? 'bg-red-400' : d.wastePercent > 20 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ height: `${d.wastePercent * 2.5}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 rotate-45 origin-left">{d.date.split(' ')[1]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Waste by Dish</h3>
              <div className="space-y-3">
                {dishStats.slice(0, 5).map((dish, i) => (
                  <div key={dish.name} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-red-100 text-red-600' : i < 3 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{dish.name}</span>
                        <span className={`text-sm font-bold ${dish.wastePercent > 30 ? 'text-red-500' : dish.wastePercent > 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {dish.wastePercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${dish.wastePercent > 30 ? 'bg-red-400' : dish.wastePercent > 20 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${dish.wastePercent * 2}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="space-y-4">
            {!showCapture ? (
              <>
                <button onClick={() => setShowCapture(true)}
                  className="w-full py-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Camera size={32} />
                  </div>
                  <span>Scan Your Tray</span>
                  <span className="text-sm opacity-80">Earn points & reduce waste</span>
                </button>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3">Recent Scans</h3>
                  {recentScans.length === 0 ? (
                    <p className="text-center text-gray-400 py-6">No scans yet today</p>
                  ) : (
                    <div className="space-y-2">
                      {recentScans.map(scan => (
                        <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Utensils size={18} className="text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-800">{scan.dish}</p>
                              <p className="text-xs text-gray-500">{scan.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${scan.waste === 'None' ? 'text-emerald-600' : scan.waste === 'Minimal' ? 'text-teal-600' : scan.waste === 'Moderate' ? 'text-amber-600' : 'text-red-500'}`}>
                              {scan.waste}
                            </p>
                            <p className="text-xs text-amber-600">+{scan.points} pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Award className="text-amber-600" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800">Level 12 - Eco Warrior</p>
                      <p className="text-sm text-amber-600">153 pts to next level</p>
                      <div className="h-2 w-48 bg-amber-200 rounded-full mt-1 overflow-hidden">
                        <div className="h-full w-3/4 bg-amber-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    {analysisResult ? 'Results' : captureStep === 'before' ? 'Step 1: Before Eating' : captureStep === 'after' ? 'Step 2: After Eating' : 'Step 3: Select Dish'}
                  </h2>
                  <button onClick={resetCapture} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>

                {!analysisResult ? (
                  <>
                    <div className="flex gap-2 mb-4">
                      {['before', 'dish', 'after'].map((step, i) => (
                        <div key={step} className={`flex-1 h-1 rounded-full ${
                          (captureStep === 'before' && i === 0) || 
                          (captureStep === 'dish' && i <= 1) || 
                          (captureStep === 'after' && i <= 2) ? 'bg-emerald-500' : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>

                    {captureStep === 'before' && (
                      <div className="space-y-4">
                        <label className="block">
                          <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${beforeImage ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                            {beforeImage ? (
                              <img src={beforeImage} alt="Before" className="w-full h-48 object-cover rounded-lg" />
                            ) : (
                              <>
                                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-600 font-medium">Take photo of full tray</p>
                                <p className="text-sm text-gray-400">Before you start eating</p>
                              </>
                            )}
                          </div>
                          <input type="file" accept="image/*" capture="environment" onChange={e => handleImageUpload(e, 'before')} className="hidden" />
                        </label>
                        {beforeImage && (
                          <button onClick={() => setCaptureStep('dish')} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
                            Next: Select Dish
                          </button>
                        )}
                      </div>
                    )}

                    {captureStep === 'dish' && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">What did you have?</p>
                        <div className="grid grid-cols-2 gap-2">
                          {DISHES.map(dish => (
                            <button key={dish} onClick={() => setSelectedDish(dish)}
                              className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${selectedDish === dish ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                              {dish}
                            </button>
                          ))}
                        </div>
                        {selectedDish && (
                          <button onClick={() => setCaptureStep('after')} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
                            Next: After Photo
                          </button>
                        )}
                      </div>
                    )}

                    {captureStep === 'after' && (
                      <div className="space-y-4">
                        <label className="block">
                          <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${afterImage ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                            {afterImage ? (
                              <img src={afterImage} alt="After" className="w-full h-48 object-cover rounded-lg" />
                            ) : (
                              <>
                                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-600 font-medium">Take photo of tray now</p>
                                <p className="text-sm text-gray-400">Show what's left</p>
                              </>
                            )}
                          </div>
                          <input type="file" accept="image/*" capture="environment" onChange={e => handleImageUpload(e, 'after')} className="hidden" />
                        </label>
                        {afterImage && (
                          <button onClick={analyzeWaste} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                            Analyze Waste
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                      analysisResult.waste === 'None' ? 'bg-emerald-100' : 
                      analysisResult.waste === 'Minimal' ? 'bg-teal-100' : 
                      analysisResult.waste === 'Moderate' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      {analysisResult.waste === 'None' ? (
                        <Award size={48} className="text-emerald-600" />
                      ) : (
                        <Trash2 size={48} className={
                          analysisResult.waste === 'Minimal' ? 'text-teal-600' : 
                          analysisResult.waste === 'Moderate' ? 'text-amber-600' : 'text-red-500'
                        } />
                      )}
                    </div>
                    
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{analysisResult.waste} Waste</p>
                      <p className="text-amber-600 font-medium">+{analysisResult.points} points earned!</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl overflow-hidden">
                        <img src={beforeImage} alt="Before" className="w-full h-24 object-cover" />
                        <p className="text-xs text-gray-500 py-1 bg-gray-50">Before</p>
                      </div>
                      <div className="rounded-xl overflow-hidden">
                        <img src={afterImage} alt="After" className="w-full h-24 object-cover" />
                        <p className="text-xs text-gray-500 py-1 bg-gray-50">After</p>
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

                    <button onClick={resetCapture} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                      Done
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white">
              <h3 className="font-semibold mb-1">Monthly Impact</h3>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">847</p>
                  <p className="text-xs opacity-80">lbs saved</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">1,270</p>
                  <p className="text-xs opacity-80">meals rescued</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">$2.5k</p>
                  <p className="text-xs opacity-80">cost savings</p>
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800">AI Recommendations</h3>
            {insights.map((insight, i) => (
              <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                insight.color === 'red' ? 'border-red-400' : 
                insight.color === 'green' ? 'border-emerald-400' : 
                insight.color === 'amber' ? 'border-amber-400' : 'border-teal-400'
              }`}>
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    insight.color === 'red' ? 'bg-red-100' : 
                    insight.color === 'green' ? 'bg-emerald-100' : 
                    insight.color === 'amber' ? 'bg-amber-100' : 'bg-teal-100'
                  }`}>
                    <insight.icon size={20} className={
                      insight.color === 'red' ? 'text-red-600' : 
                      insight.color === 'green' ? 'text-emerald-600' : 
                      insight.color === 'amber' ? 'text-amber-600' : 'text-teal-600'
                    } />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{insight.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{insight.text}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Best Performing Days</h3>
              <div className="space-y-2">
                {['Tuesday', 'Thursday', 'Friday'].map((day, i) => (
                  <div key={day} className="flex items-center justify-between p-2">
                    <span className="text-gray-700">{day}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${85 - i * 8}%` }} />
                      </div>
                      <span className="text-sm font-medium text-emerald-600">{85 - i * 8}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}