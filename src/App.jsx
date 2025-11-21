import { useState } from 'react';
import { 
  Camera, TrendingDown, TrendingUp, BarChart3, Utensils, Leaf, 
  AlertTriangle, ChevronRight, X, Upload, Trash2, Award, Calendar, 
  PieChart, Lightbulb, ArrowDown, ArrowUp 
} from 'lucide-react';
import './index.css';
import './App.css';

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

  const WasteBar = ({ percent }) => (
    <div className="waste-bar">
      <div className={`waste-fill ${percent > 30 ? 'red' : percent > 20 ? 'amber' : 'green'}`} style={{ height: `${percent}%` }} />
    </div>
  );

  return (
    <div id="root">
      <header className="flex justify-between items-center">
        <div>
          <h1>🌿 EcoDining</h1>
          <p>Reduce waste. Save food. Earn rewards.</p>
        </div>
        <div className="flex items-center gap">
          <Award size={20} />
          <span>{userPoints}</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap mb">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'scan', label: 'Scan Tray', icon: Camera },
          { id: 'insights', label: 'Insights', icon: Lightbulb },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div>
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap">
            <div className="card">
              <p>Avg Waste</p>
              <p>{avgWaste.toFixed(1)}%</p>
              <p>{wasteChange.toFixed(1)}%</p>
            </div>
            <div className="card">
              <p>Trays Scanned</p>
              <p>{totalTrays}</p>
            </div>
            <div className="card">
              <p>Food Saved</p>
              <p>{Math.floor(totalTrays * 0.15)} lbs</p>
            </div>
          </div>

          {/* Waste Trend */}
          <div className="card">
            <h3>Waste Trend</h3>
            <div className="flex items-end gap">
              {periodData.slice(-14).map((d, i) => (
                <WasteBar key={i} percent={d.wastePercent * 2.5} />
              ))}
            </div>
          </div>

          {/* Waste by Dish */}
          <div className="card">
            <h3>Waste by Dish</h3>
            {dishStats.slice(0,5).map((dish, i) => (
              <div key={dish.name}>
                <p>{dish.name}: {dish.wastePercent.toFixed(1)}%</p>
                <WasteBar percent={dish.wastePercent * 2} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan and Insights tabs would follow similarly, using the same card/flex/grid classes */}
    </div>
  );
}
