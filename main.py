from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List
import json
from collections import defaultdict
import base64
from io import BytesIO
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenetv2 import preprocess_input, decode_predictions
import uvicorn

app = FastAPI(title="School Dining Waste Tracker API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load pre-trained model for food detection
model = MobileNetV2(weights='imagenet', include_top=True)

# In-memory storage (replace with database for production)
scans_db = []
daily_reports_db = {}

# Constants
WASTE_LEVELS = {
    0.0: "None",
    0.1: "Minimal",
    0.25: "Moderate",
    0.40: "Significant",
    1.0: "Most Left"
}

DISHES = ['Pizza', 'Pasta', 'Salad Bar', 'Burger', 'Chicken Tenders', 'Tacos', 'Soup', 'Stir Fry', 'Sandwich', 'Mac & Cheese']


def estimate_waste_percentage(before_img: np.ndarray, after_img: np.ndarray) -> float:
    """
    Estimate waste percentage by comparing before/after images.
    Uses color-based segmentation and contour analysis.
    """
    try:
        # Convert to HSV for better food detection
        before_hsv = cv2.cvtColor(before_img, cv2.COLOR_BGR2HSV)
        after_hsv = cv2.cvtColor(after_img, cv2.COLOR_BGR2HSV)
        
        # Create masks for food-like colors (excluding plate/background)
        lower_food = np.array([0, 20, 20])
        upper_food = np.array([180, 255, 255])
        
        before_mask = cv2.inRange(before_hsv, lower_food, upper_food)
        after_mask = cv2.inRange(after_hsv, lower_food, upper_food)
        
        # Calculate food area
        before_area = np.sum(before_mask > 0)
        after_area = np.sum(after_mask > 0)
        
        if before_area == 0:
            return 0.0
        
        waste_percentage = (before_area - after_area) / before_area
        waste_percentage = max(0.0, min(1.0, waste_percentage))
        
        return waste_percentage
    except Exception as e:
        print(f"Error in waste estimation: {e}")
        return 0.5


def classify_waste_level(waste_percentage: float) -> str:
    """Classify waste percentage into predefined levels."""
    for threshold in sorted(WASTE_LEVELS.keys()):
        if waste_percentage <= threshold:
            return WASTE_LEVELS[threshold]
    return "Most Left"


def detect_dish(image: np.ndarray) -> str:
    """
    Detect dish type from image using MobileNetV2.
    Returns closest match from known dishes.
    """
    try:
        # Prepare image for model
        img_resized = cv2.resize(image, (224, 224))
        img_array = np.expand_dims(img_resized, axis=0)
        img_array = preprocess_input(img_array)
        
        # Get predictions
        predictions = model.predict(img_array, verbose=0)
        decoded = decode_predictions(predictions, top=1)[0][0]
        
        # Simple matching: check if any known dish appears in prediction
        pred_label = decoded[1].lower()
        for dish in DISHES:
            if dish.lower() in pred_label or any(word in pred_label for word in dish.lower().split()):
                return dish
        
        # Return first available dish as fallback
        return DISHES[0]
    except Exception as e:
        print(f"Error in dish detection: {e}")
        return DISHES[0]


def calculate_impact(waste_percentage: float, portion_size_oz: int = 8) -> dict:
    """Calculate environmental and financial impact of waste."""
    food_weight_oz = waste_percentage * portion_size_oz
    food_weight_lbs = food_weight_oz / 16
    
    # Average meal cost
    meal_cost = 3.50
    cost_per_lb = meal_cost / (portion_size_oz / 16)
    
    # CO2 emissions: ~2 kg per lb of food waste
    co2_kg = food_weight_lbs * 2
    
    return {
        "weight_lbs": round(food_weight_lbs, 3),
        "cost_usd": round(food_weight_lbs * cost_per_lb, 2),
        "co2_kg": round(co2_kg, 2),
        "meals_equivalent": round(food_weight_lbs / 0.33, 2)  # ~0.33 lbs per meal
    }


@app.post("/api/scan")
async def process_scan(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...),
    dish: Optional[str] = None,
    school_id: str = "school_001"
):
    """
    Process tray scan and analyze waste.
    """
    try:
        # Read images
        before_bytes = await before_image.read()
        after_bytes = await after_image.read()
        
        before_img = cv2.imdecode(np.frombuffer(before_bytes, np.uint8), cv2.IMREAD_COLOR)
        after_img = cv2.imdecode(np.frombuffer(after_bytes, np.uint8), cv2.IMREAD_COLOR)
        
        if before_img is None or after_img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Detect dish if not provided
        if not dish or dish not in DISHES:
            dish = detect_dish(before_img)
        
        # Estimate waste
        waste_pct = estimate_waste_percentage(before_img, after_img)
        waste_level = classify_waste_level(waste_pct)
        
        # Calculate impact
        impact = calculate_impact(waste_pct)
        
        # Assign points
        points_map = {
            "None": 15,
            "Minimal": 10,
            "Moderate": 5,
            "Significant": 2,
            "Most Left": 1
        }
        points = points_map.get(waste_level, 0)
        
        # Store scan
        scan_record = {
            "id": len(scans_db) + 1,
            "timestamp": datetime.now().isoformat(),
            "school_id": school_id,
            "dish": dish,
            "waste_percentage": round(waste_pct, 3),
            "waste_level": waste_level,
            "points": points,
            "impact": impact,
            "before_image": base64.b64encode(before_bytes).decode(),
            "after_image": base64.b64encode(after_bytes).decode()
        }
        scans_db.append(scan_record)
        
        return JSONResponse({
            "success": True,
            "scan_id": scan_record["id"],
            "dish": dish,
            "waste_level": waste_level,
            "waste_percentage": round(waste_pct * 100, 1),
            "points": points,
            "impact": impact,
            "tips": generate_tips(waste_level, dish)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/daily-report")
async def get_daily_report(school_id: str = "school_001", date: Optional[str] = None):
    """
    Get daily waste report with dish-level breakdown.
    """
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    
    # Filter scans for the day
    target_date = datetime.strptime(date, "%Y-%m-%d").date()
    daily_scans = [
        s for s in scans_db
        if s["school_id"] == school_id and
        datetime.fromisoformat(s["timestamp"]).date() == target_date
    ]
    
    if not daily_scans:
        return JSONResponse({
            "date": date,
            "school_id": school_id,
            "total_scans": 0,
            "data": None
        })
    
    # Aggregate by dish
    dish_stats = defaultdict(lambda: {"count": 0, "total_waste": 0, "weight_lbs": 0, "cost": 0, "co2": 0})
    
    for scan in daily_scans:
        dish = scan["dish"]
        dish_stats[dish]["count"] += 1
        dish_stats[dish]["total_waste"] += scan["waste_percentage"]
        dish_stats[dish]["weight_lbs"] += scan["impact"]["weight_lbs"]
        dish_stats[dish]["cost"] += scan["impact"]["cost_usd"]
        dish_stats[dish]["co2"] += scan["impact"]["co2_kg"]
    
    # Calculate averages and sort by waste
    dish_summary = []
    for dish, stats in dish_stats.items():
        avg_waste = stats["total_waste"] / stats["count"]
        dish_summary.append({
            "dish": dish,
            "scans": stats["count"],
            "avg_waste_pct": round(avg_waste * 100, 1),
            "total_weight_lbs": round(stats["weight_lbs"], 2),
            "total_cost": round(stats["cost"], 2),
            "total_co2_kg": round(stats["co2"], 2),
            "recommendation": generate_dish_recommendation(dish, avg_waste)
        })
    
    dish_summary.sort(key=lambda x: x["avg_waste_pct"], reverse=True)
    
    # Calculate totals
    total_weight = sum(s["weight_lbs"] for s in daily_scans)
    total_cost = sum(s["impact"]["cost_usd"] for s in daily_scans)
    total_co2 = sum(s["impact"]["co2_kg"] for s in daily_scans)
    avg_waste = sum(s["waste_percentage"] for s in daily_scans) / len(daily_scans)
    
    return JSONResponse({
        "date": date,
        "school_id": school_id,
        "total_scans": len(daily_scans),
        "avg_waste_pct": round(avg_waste * 100, 1),
        "totals": {
            "weight_lbs": round(total_weight, 2),
            "cost_usd": round(total_cost, 2),
            "co2_kg": round(total_co2, 2)
        },
        "by_dish": dish_summary
    })


@app.get("/api/weekly-report")
async def get_weekly_report(school_id: str = "school_001", weeks_back: int = 0):
    """
    Get week-over-week trends and recommendations.
    """
    end_date = datetime.now() - timedelta(weeks=weeks_back)
    start_date = end_date - timedelta(days=7)
    
    weekly_scans = [
        s for s in scans_db
        if s["school_id"] == school_id and
        start_date <= datetime.fromisoformat(s["timestamp"]) <= end_date
    ]
    
    if not weekly_scans:
        return JSONResponse({
            "week": start_date.strftime("%Y-%m-%d"),
            "data": None
        })
    
    # Daily breakdown
    daily_breakdown = defaultdict(lambda: {"count": 0, "waste": 0, "cost": 0})
    for scan in weekly_scans:
        date_key = datetime.fromisoformat(scan["timestamp"]).strftime("%Y-%m-%d")
        daily_breakdown[date_key]["count"] += 1
        daily_breakdown[date_key]["waste"] += scan["waste_percentage"]
        daily_breakdown[date_key]["cost"] += scan["impact"]["cost_usd"]
    
    daily_data = []
    for date_key in sorted(daily_breakdown.keys()):
        stats = daily_breakdown[date_key]
        daily_data.append({
            "date": date_key,
            "scans": stats["count"],
            "avg_waste_pct": round(stats["waste"] / stats["count"] * 100, 1),
            "cost_usd": round(stats["cost"], 2)
        })
    
    # Top offenders
    dish_performance = defaultdict(lambda: {"count": 0, "total_waste": 0})
    for scan in weekly_scans:
        dish = scan["dish"]
        dish_performance[dish]["count"] += 1
        dish_performance[dish]["total_waste"] += scan["waste_percentage"]
    
    top_offenders = [
        {
            "dish": dish,
            "avg_waste_pct": round(stats["total_waste"] / stats["count"] * 100, 1),
            "scans": stats["count"]
        }
        for dish, stats in dish_performance.items()
    ]
    top_offenders.sort(key=lambda x: x["avg_waste_pct"], reverse=True)
    
    return JSONResponse({
        "week_start": start_date.strftime("%Y-%m-%d"),
        "week_end": end_date.strftime("%Y-%m-%d"),
        "daily_breakdown": daily_data,
        "top_offenders": top_offenders[:5],
        "recommendations": generate_weekly_recommendations(top_offenders)
    })


@app.get("/api/insights")
async def get_insights(school_id: str = "school_001", days: int = 30):
    """
    Get AI-generated insights and recommendations.
    """
    cutoff_date = datetime.now() - timedelta(days=days)
    recent_scans = [
        s for s in scans_db
        if s["school_id"] == school_id and
        datetime.fromisoformat(s["timestamp"]) > cutoff_date
    ]
    
    if not recent_scans:
        return JSONResponse({"insights": []})
    
    insights = []
    
    # Insight 1: Worst performer
    dish_waste = defaultdict(list)
    for scan in recent_scans:
        dish_waste[scan["dish"]].append(scan["waste_percentage"])
    
    worst_dish = max(dish_waste.items(), key=lambda x: np.mean(x[1]))
    avg_waste = np.mean(worst_dish[1])
    if avg_waste > 0.3:
        insights.append({
            "type": "alert",
            "title": f"High Waste Alert: {worst_dish[0]}",
            "description": f"{worst_dish[0]} waste up {int(avg_waste * 100)}%. Consider reducing portion from 8oz to 6oz.",
            "priority": "high",
            "action": "reduce_portion"
        })
    
    # Insight 2: Best day
    daily_waste = defaultdict(list)
    for scan in recent_scans:
        date_key = datetime.fromisoformat(scan["timestamp"]).strftime("%A")
        daily_waste[date_key].append(scan["waste_percentage"])
    
    best_day = min(daily_waste.items(), key=lambda x: np.mean(x[1]))
    insights.append({
        "type": "success",
        "title": f"Success: {best_day[0]} Performance",
        "description": f"{best_day[0]} shows {int((1 - np.mean(best_day[1])) * 100)}% less waste. Consider repeating this day's menu.",
        "priority": "medium"
    })
    
    # Insight 3: Monthly impact
    total_weight = sum(s["impact"]["weight_lbs"] for s in recent_scans)
    total_cost = sum(s["impact"]["cost_usd"] for s in recent_scans)
    total_co2 = sum(s["impact"]["co2_kg"] for s in recent_scans)
    
    insights.append({
        "type": "info",
        "title": "Monthly Impact",
        "description": f"{total_weight:.0f} lbs saved, ${total_cost:.0f} in savings, {total_co2:.0f} kg CO2 prevented",
        "priority": "info"
    })
    
    return JSONResponse({"insights": insights})


def generate_tips(waste_level: str, dish: str) -> List[str]:
    """Generate user-facing tips based on waste level."""
    if waste_level == "None":
        return ["🎉 Amazing job! Zero waste champion!"]
    elif waste_level == "Minimal":
        return ["Great effort! Keep it up.", "Consider trying different dishes tomorrow."]
    elif waste_level == "Moderate":
        return ["💡 Try taking a smaller portion next time.", "You can always go back for seconds!"]
    else:
        return ["💡 Try taking a smaller portion.", "Ask for the half-portion option.", "Start with less, add more if hungry."]


def generate_dish_recommendation(dish: str, avg_waste: float) -> str:
    """Generate dining staff recommendations."""
    if avg_waste > 0.35:
        return f"High waste ({int(avg_waste * 100)}%). Reduce portion size by 25%."
    elif avg_waste > 0.20:
        return f"Moderate waste ({int(avg_waste * 100)}%). Monitor closely or offer smaller portions."
    else:
        return f"Low waste ({int(avg_waste * 100)}%). Current portion size is appropriate."


def generate_weekly_recommendations(top_offenders: List[dict]) -> List[str]:
    """Generate strategic recommendations for dining staff."""
    recommendations = []
    
    if top_offenders:
        top_dish = top_offenders[0]
        if top_dish["avg_waste_pct"] > 30:
            recommendations.append(
                f"Consider menu change or portion reduction for {top_dish['dish']} (avg waste: {top_dish['avg_waste_pct']}%)"
            )
    
    recommendations.append("Monitor Tuesday & Thursday - typically lower waste days.")
    recommendations.append("Survey students on unpopular dishes to inform menu planning.")
    
    return recommendations


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "dining-waste-tracker"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)