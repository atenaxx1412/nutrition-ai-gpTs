import { NextRequest, NextResponse } from 'next/server';
import { UserService, MealService, GoalService } from '@/services/database';

// Get user profile and recent data
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile
    const userProfile = await UserService.getUser(userId);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent meals (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMeals = await MealService.getMealsByDateRange(
      userId,
      sevenDaysAgo,
      new Date()
    );

    // Get active goal
    const activeGoal = await GoalService.getActiveGoal(userId);

    return NextResponse.json({
      success: true,
      data: {
        profile: userProfile,
        recentMeals,
        activeGoal,
        stats: {
          totalMeals: recentMeals.length,
          averageDailyCalories: calculateAverageDailyCalories(recentMeals),
        },
      },
    });

  } catch (error) {
    console.error('Error getting user data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const updates = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await UserService.updateUser(userId, updates);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Get updated user profile
    const updatedProfile = await UserService.getUser(userId);

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'User profile updated successfully',
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    const profileData = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'age', 'gender', 'height', 'weight', 'activityLevel'];
    const missingFields = requiredFields.filter(field => !profileData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    const result = await UserService.createUser(profileData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Get the created user profile
    const newProfile = await UserService.getUser(result.id!);

    return NextResponse.json({
      success: true,
      data: newProfile,
      message: 'User profile created successfully',
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user profile' },
      { status: 500 }
    );
  }
}

// Helper function to calculate average daily calories
function calculateAverageDailyCalories(meals: any[]): number {
  if (meals.length === 0) return 0;

  // Group meals by date
  const mealsByDate: Record<string, number> = {};
  
  meals.forEach(meal => {
    const date = meal.timestamp.toISOString().split('T')[0];
    if (!mealsByDate[date]) {
      mealsByDate[date] = 0;
    }
    mealsByDate[date] += meal.totalNutrition.calories;
  });

  const totalDays = Object.keys(mealsByDate).length;
  const totalCalories = Object.values(mealsByDate).reduce((sum, calories) => sum + calories, 0);

  return totalDays > 0 ? Math.round(totalCalories / totalDays) : 0;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}