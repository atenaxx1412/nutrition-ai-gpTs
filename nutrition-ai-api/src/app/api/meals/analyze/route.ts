import { NextRequest, NextResponse } from 'next/server';
import { VisionService } from '@/services/vision';
import { MealService } from '@/services/database';
import { MealRecord, FoodItem } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userId = formData.get('userId') as string;
    const mealType = formData.get('mealType') as string;
    const notes = formData.get('notes') as string;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // Analyze image using Google Vision API
    const analysisResult = await VisionService.analyzeImageWithObjectDetection(imageBuffer);

    // Convert detected foods to food items
    const foodItems: FoodItem[] = analysisResult.detectedFoods.map((detectedFood, index) => ({
      id: `${Date.now()}_${index}`,
      name: detectedFood.name,
      quantity: detectedFood.estimatedQuantity,
      unit: detectedFood.unit,
      nutrition: detectedFood.nutrition,
      category: 'detected', // You can enhance this based on food categorization
    }));

    // Create meal record
    const mealRecord: Omit<MealRecord, 'id'> = {
      userId,
      mealType: (mealType as any) || 'meal',
      foodItems,
      totalNutrition: analysisResult.totalNutrition,
      notes,
      timestamp: new Date(),
      confidence: analysisResult.confidence,
      analysisMethod: 'image',
    };

    // Save to database
    const saveResult = await MealService.createMeal(mealRecord);

    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save meal record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        mealId: saveResult.id,
        analysis: analysisResult,
        meal: {
          ...mealRecord,
          id: saveResult.id,
        },
      },
    });

  } catch (error) {
    console.error('Meal analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze meal' },
      { status: 500 }
    );
  }
}

// Handle text-based meal input
export async function PUT(request: NextRequest) {
  try {
    const { userId, mealType, foodDescription, notes } = await request.json();

    if (!userId || !foodDescription) {
      return NextResponse.json(
        { success: false, error: 'User ID and food description are required' },
        { status: 400 }
      );
    }

    // Simple text parsing for MVP (can be enhanced with NLP)
    const foodItems = parseTextToFoodItems(foodDescription);
    
    // Calculate total nutrition
    const totalNutrition = calculateTotalNutrition(foodItems);

    const mealRecord: Omit<MealRecord, 'id'> = {
      userId,
      mealType: mealType || 'meal',
      foodItems,
      totalNutrition,
      notes: notes || foodDescription,
      timestamp: new Date(),
      confidence: 0.7, // Lower confidence for text input
      analysisMethod: 'manual',
    };

    const saveResult = await MealService.createMeal(mealRecord);

    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save meal record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        mealId: saveResult.id,
        meal: {
          ...mealRecord,
          id: saveResult.id,
        },
      },
    });

  } catch (error) {
    console.error('Text meal analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process meal text' },
      { status: 500 }
    );
  }
}

// Simple text parser for food descriptions
function parseTextToFoodItems(description: string): FoodItem[] {
  // Basic implementation - can be enhanced with proper NLP
  const commonFoods = {
    'rice': { calories: 130, protein: 2.7, carbohydrates: 28, fat: 0.3 },
    'chicken': { calories: 165, protein: 31, carbohydrates: 0, fat: 3.6 },
    'broccoli': { calories: 34, protein: 2.8, carbohydrates: 7, fat: 0.4 },
    'salmon': { calories: 208, protein: 22, carbohydrates: 0, fat: 12 },
    'apple': { calories: 52, protein: 0.3, carbohydrates: 14, fat: 0.2 },
  };

  const words = description.toLowerCase().split(/\s+/);
  const detectedFoods: FoodItem[] = [];

  Object.keys(commonFoods).forEach(food => {
    if (words.some(word => word.includes(food))) {
      const nutrition = commonFoods[food as keyof typeof commonFoods];
      detectedFoods.push({
        id: `${Date.now()}_${food}`,
        name: food,
        quantity: 100, // Default 100g
        unit: 'g',
        nutrition: {
          ...nutrition,
          fiber: 2,
          sugar: 5,
          sodium: 50,
          cholesterol: 10,
        },
        category: 'manual',
      });
    }
  });

  // If no foods detected, create a generic entry
  if (detectedFoods.length === 0) {
    detectedFoods.push({
      id: `${Date.now()}_unknown`,
      name: 'Mixed meal',
      quantity: 200,
      unit: 'g',
      nutrition: {
        calories: 300,
        protein: 15,
        carbohydrates: 30,
        fat: 10,
        fiber: 5,
        sugar: 8,
        sodium: 100,
        cholesterol: 20,
      },
      category: 'estimated',
    });
  }

  return detectedFoods;
}

function calculateTotalNutrition(foodItems: FoodItem[]) {
  const total = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    cholesterol: 0,
  };

  foodItems.forEach(item => {
    const multiplier = item.quantity / 100;
    total.calories += item.nutrition.calories * multiplier;
    total.protein += item.nutrition.protein * multiplier;
    total.carbohydrates += item.nutrition.carbohydrates * multiplier;
    total.fat += item.nutrition.fat * multiplier;
    total.fiber += item.nutrition.fiber * multiplier;
    total.sugar += item.nutrition.sugar * multiplier;
    total.sodium += item.nutrition.sodium * multiplier;
    total.cholesterol += item.nutrition.cholesterol * multiplier;
  });

  // Round to 1 decimal place
  Object.keys(total).forEach(key => {
    total[key as keyof typeof total] = Math.round(total[key as keyof typeof total] * 10) / 10;
  });

  return total;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}