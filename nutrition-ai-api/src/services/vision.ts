import { ImageAnnotatorClient } from '@google-cloud/vision';
import { DetectedFood, ImageAnalysisResult, NutritionInfo } from '@/types/database';

// Initialize Google Vision API client
const vision = new ImageAnnotatorClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Path to service account key file
});

// Nutrition database (simplified for MVP - in production, use proper nutrition API)
const NUTRITION_DATABASE: Record<string, NutritionInfo> = {
  rice: {
    calories: 130,
    protein: 2.7,
    carbohydrates: 28,
    fat: 0.3,
    fiber: 0.4,
    sugar: 0.1,
    sodium: 5,
    cholesterol: 0,
  },
  chicken: {
    calories: 165,
    protein: 31,
    carbohydrates: 0,
    fat: 3.6,
    fiber: 0,
    sugar: 0,
    sodium: 74,
    cholesterol: 85,
  },
  broccoli: {
    calories: 34,
    protein: 2.8,
    carbohydrates: 7,
    fat: 0.4,
    fiber: 2.6,
    sugar: 1.5,
    sodium: 33,
    cholesterol: 0,
  },
  salmon: {
    calories: 208,
    protein: 22,
    carbohydrates: 0,
    fat: 12,
    fiber: 0,
    sugar: 0,
    sodium: 59,
    cholesterol: 59,
  },
  apple: {
    calories: 52,
    protein: 0.3,
    carbohydrates: 14,
    fat: 0.2,
    fiber: 2.4,
    sugar: 10,
    sodium: 1,
    cholesterol: 0,
  },
  // Add more foods as needed
};

// Food category mapping for better recognition
const FOOD_CATEGORIES = {
  'dish': ['rice', 'pasta', 'noodles', 'curry', 'stir fry'],
  'meat': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna'],
  'vegetable': ['broccoli', 'carrot', 'spinach', 'tomato', 'onion'],
  'fruit': ['apple', 'banana', 'orange', 'strawberry', 'grape'],
  'grain': ['bread', 'rice', 'quinoa', 'oats', 'wheat'],
  'dairy': ['milk', 'cheese', 'yogurt', 'butter'],
};

export class VisionService {
  static async analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
    try {
      // Perform label detection
      const [labelResult] = await vision.labelDetection({
        image: { content: imageBuffer },
      });

      const labels = labelResult.labelAnnotations || [];
      
      // Extract food-related labels
      const foodLabels = labels.filter(label => 
        this.isFoodRelated(label.description?.toLowerCase() || '')
      );

      // Convert labels to detected foods
      const detectedFoods = this.labelsToDetectedFoods(foodLabels);

      // Calculate total nutrition
      const totalNutrition = this.calculateTotalNutrition(detectedFoods);

      // Calculate overall confidence
      const confidence = detectedFoods.length > 0 
        ? detectedFoods.reduce((sum, food) => sum + food.confidence, 0) / detectedFoods.length
        : 0;

      return {
        detectedFoods,
        totalNutrition,
        confidence,
        analysisTime: new Date(),
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image');
    }
  }

  static async analyzeImageWithObjectDetection(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
    try {
      // Perform object localization for more precise detection
      const [objectResult] = await vision.objectLocalization({
        image: { content: imageBuffer },
      });

      const objects = objectResult.localizedObjectAnnotations || [];
      
      // Filter food objects
      const foodObjects = objects.filter(obj => 
        this.isFoodRelated(obj.name?.toLowerCase() || '')
      );

      // Convert objects to detected foods with bounding boxes
      const detectedFoods = this.objectsToDetectedFoods(foodObjects);

      // Fallback to label detection if no objects found
      if (detectedFoods.length === 0) {
        return this.analyzeImage(imageBuffer);
      }

      const totalNutrition = this.calculateTotalNutrition(detectedFoods);
      const confidence = detectedFoods.length > 0 
        ? detectedFoods.reduce((sum, food) => sum + food.confidence, 0) / detectedFoods.length
        : 0;

      return {
        detectedFoods,
        totalNutrition,
        confidence,
        analysisTime: new Date(),
      };
    } catch (error) {
      console.error('Error analyzing image with object detection:', error);
      // Fallback to basic label detection
      return this.analyzeImage(imageBuffer);
    }
  }

  private static isFoodRelated(description: string): boolean {
    const foodKeywords = [
      'food', 'dish', 'meal', 'cuisine', 'ingredient', 'vegetable', 'fruit',
      'meat', 'fish', 'chicken', 'beef', 'pork', 'rice', 'bread', 'pasta',
      'salad', 'soup', 'dessert', 'drink', 'beverage', 'dairy', 'grain',
      'protein', 'carbohydrate', 'produce', 'seafood', 'poultry'
    ];

    return foodKeywords.some(keyword => description.includes(keyword)) ||
           Object.values(FOOD_CATEGORIES).flat().some(food => description.includes(food));
  }

  private static labelsToDetectedFoods(labels: any[]): DetectedFood[] {
    return labels.map(label => {
      const foodName = this.mapLabelToFood(label.description?.toLowerCase() || '');
      const nutrition = NUTRITION_DATABASE[foodName] || this.getDefaultNutrition();
      
      return {
        name: foodName,
        confidence: label.score || 0,
        estimatedQuantity: 100, // Default 100g serving
        unit: 'g',
        nutrition,
      };
    }).filter(food => food.name !== 'unknown');
  }

  private static objectsToDetectedFoods(objects: any[]): DetectedFood[] {
    return objects.map(obj => {
      const foodName = this.mapLabelToFood(obj.name?.toLowerCase() || '');
      const nutrition = NUTRITION_DATABASE[foodName] || this.getDefaultNutrition();
      
      return {
        name: foodName,
        confidence: obj.score || 0,
        boundingBox: obj.boundingPoly ? {
          x: obj.boundingPoly.normalizedVertices[0].x || 0,
          y: obj.boundingPoly.normalizedVertices[0].y || 0,
          width: (obj.boundingPoly.normalizedVertices[2].x || 1) - (obj.boundingPoly.normalizedVertices[0].x || 0),
          height: (obj.boundingPoly.normalizedVertices[2].y || 1) - (obj.boundingPoly.normalizedVertices[0].y || 0),
        } : undefined,
        estimatedQuantity: 100,
        unit: 'g',
        nutrition,
      };
    }).filter(food => food.name !== 'unknown');
  }

  private static mapLabelToFood(label: string): string {
    // Direct mapping
    if (NUTRITION_DATABASE[label]) {
      return label;
    }

    // Category-based mapping
    for (const [category, foods] of Object.entries(FOOD_CATEGORIES)) {
      if (label.includes(category)) {
        // Return the first food in the category as a default
        const matchingFood = foods.find(food => NUTRITION_DATABASE[food]);
        if (matchingFood) return matchingFood;
      }
      
      // Check if any food in the category matches the label
      const matchingFood = foods.find(food => label.includes(food) && NUTRITION_DATABASE[food]);
      if (matchingFood) return matchingFood;
    }

    // Specific mappings for common vision API results
    const mappings: Record<string, string> = {
      'staple food': 'rice',
      'produce': 'broccoli',
      'animal product': 'chicken',
      'seafood': 'salmon',
      'poultry': 'chicken',
      'citrus': 'apple', // fallback to apple for fruits
      'plant': 'broccoli', // fallback to broccoli for vegetables
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (label.includes(key)) {
        return value;
      }
    }

    return 'unknown';
  }

  private static getDefaultNutrition(): NutritionInfo {
    return {
      calories: 100,
      protein: 5,
      carbohydrates: 15,
      fat: 3,
      fiber: 2,
      sugar: 5,
      sodium: 50,
      cholesterol: 10,
    };
  }

  private static calculateTotalNutrition(detectedFoods: DetectedFood[]): NutritionInfo {
    const total: NutritionInfo = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    };

    detectedFoods.forEach(food => {
      const multiplier = food.estimatedQuantity / 100; // Convert to per 100g basis
      total.calories += food.nutrition.calories * multiplier;
      total.protein += food.nutrition.protein * multiplier;
      total.carbohydrates += food.nutrition.carbohydrates * multiplier;
      total.fat += food.nutrition.fat * multiplier;
      total.fiber += food.nutrition.fiber * multiplier;
      total.sugar += food.nutrition.sugar * multiplier;
      total.sodium += food.nutrition.sodium * multiplier;
      total.cholesterol += food.nutrition.cholesterol * multiplier;
    });

    // Round to 1 decimal place
    Object.keys(total).forEach(key => {
      total[key as keyof NutritionInfo] = Math.round(total[key as keyof NutritionInfo] * 10) / 10;
    });

    return total;
  }

  // Helper method to estimate portion size based on image analysis
  static estimatePortionSize(boundingBox?: { width: number; height: number }): number {
    if (!boundingBox) return 100; // Default 100g

    const area = boundingBox.width * boundingBox.height;
    
    // Simple estimation based on bounding box area
    if (area < 0.1) return 50;   // Small portion
    if (area < 0.3) return 100;  // Medium portion
    if (area < 0.6) return 150;  // Large portion
    return 200; // Extra large portion
  }
}