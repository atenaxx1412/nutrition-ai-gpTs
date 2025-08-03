// User Profile Types
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietaryRestrictions: string[];
  allergies: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Nutrition Information
export interface NutritionInfo {
  calories: number;
  protein: number; // g
  carbohydrates: number; // g
  fat: number; // g
  fiber: number; // g
  sugar: number; // g
  sodium: number; // mg
  cholesterol: number; // mg
  vitaminC?: number; // mg
  calcium?: number; // mg
  iron?: number; // mg
}

// Meal Record Types
export interface MealRecord {
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodItems: FoodItem[];
  totalNutrition: NutritionInfo;
  imageUrl?: string;
  notes?: string;
  timestamp: Date;
  confidence: number; // 0-1 for analysis confidence
  analysisMethod: 'image' | 'manual' | 'barcode';
}

// Food Item Types
export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // g, ml, piece, cup, etc.
  nutrition: NutritionInfo;
  category: string;
  brand?: string;
}

// Goal Types
export interface NutritionGoal {
  id: string;
  userId: string;
  type: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'health_improvement';
  targetWeight?: number;
  targetDate?: Date;
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Progress Tracking
export interface ProgressRecord {
  id: string;
  userId: string;
  date: Date;
  weight?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  measurements?: {
    waist?: number;
    chest?: number;
    arms?: number;
    thighs?: number;
  };
  notes?: string;
}

// Family/Team Management
export interface Family {
  id: string;
  name: string;
  adminUserId: string;
  members: FamilyMember[];
  sharedGoals: SharedGoal[];
  mealPlans: MealPlan[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  userId: string;
  role: 'admin' | 'member';
  nickname: string;
  joinedAt: Date;
}

export interface SharedGoal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  participants: string[]; // userIds
  progress: number; // 0-100
  createdAt: Date;
}

export interface MealPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  meals: PlannedMeal[];
  targetUsers: string[]; // userIds
  createdBy: string; // userId
  createdAt: Date;
}

export interface PlannedMeal {
  day: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodItems: FoodItem[];
  instructions?: string;
}

// Analysis & Reports
export interface NutritionAnalysis {
  id: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  averageNutrition: NutritionInfo;
  goalComparison: {
    caloriesAchieved: number;
    proteinAchieved: number;
    carbsAchieved: number;
    fatAchieved: number;
  };
  trends: {
    weightTrend: 'increasing' | 'decreasing' | 'stable';
    nutritionConsistency: number; // 0-1
  };
  recommendations: string[];
  generatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ImageAnalysisResult {
  detectedFoods: DetectedFood[];
  totalNutrition: NutritionInfo;
  confidence: number;
  analysisTime: Date;
  analysisNotes?: string; // Gemini AI nutritionist advice
}

export interface DetectedFood {
  id: string;
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  estimatedQuantity: number;
  unit: string;
  nutrition: NutritionInfo;
  category: string;
}