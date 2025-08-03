import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetectedFood, ImageAnalysisResult, NutritionInfo } from '@/types/database';

// Gemini API response types
interface GeminiNutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
}

interface GeminiFood {
  name: string;
  estimated_weight: number;
  nutrition: GeminiNutrition;
  confidence: number;
  category: string;
}

interface GeminiResponse {
  detected_foods: GeminiFood[];
  total_nutrition: GeminiNutrition;
  analysis_notes: string;
  overall_confidence: number;
}

// Google Vision API types
interface VisionLabel {
  description?: string;
  score?: number;
}

interface VisionObject {
  name?: string;
  score?: number;
  boundingPoly?: {
    normalizedVertices: { x?: number; y?: number }[];
  };
}

// Initialize Google Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
      console.log('🔍 Gemini API で食事分析開始...');

      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.detectMimeType(imageBuffer);

      // Optimized nutrition analysis prompt
      const prompt = `
あなたは栄養士として、この食事画像を詳細に分析してください。

## 分析要求:
1. 画像内の全ての食べ物・飲み物を識別
2. 各食材の推定重量（グラム）
3. 正確な栄養成分計算
4. 調味料・ソース・油分も考慮

## 出力形式（必ずJSONで返答）:
\`\`\`json
{
  "detected_foods": [
    {
      "name": "食材名（日本語）",
      "estimated_weight": 数値（グラム）,
      "nutrition": {
        "calories": 数値,
        "protein": 数値,
        "carbohydrates": 数値,
        "fat": 数値,
        "fiber": 数値,
        "sugar": 数値,
        "sodium": 数値,
        "cholesterol": 数値
      },
      "confidence": 0.0～1.0,
      "category": "カテゴリ（protein/carbs/vegetables/etc）"
    }
  ],
  "total_nutrition": {
    "calories": 合計値,
    "protein": 合計値,
    "carbohydrates": 合計値,
    "fat": 合計値,
    "fiber": 合計値,
    "sugar": 合計値,
    "sodium": 合計値,
    "cholesterol": 合計値
  },
  "analysis_notes": "栄養士としてのコメント・アドバイス",
  "overall_confidence": 0.0～1.0
}
\`\`\`

## 重要な注意点:
- 見えない調味料・油分も推定に含める
- 日本の標準的な食品成分表に基づく
- 不明な場合は confidence を下げる
- 必ずJSON形式で回答する
`;

      // Generate content with image
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ]);

      const responseText = result.response.text();
      console.log('📊 Gemini API レスポンス受信');

      // Extract JSON from response
      const analysisData = this.extractJsonFromResponse(responseText);

      // Convert to our format
      return this.convertGeminiResponse(analysisData);

    } catch (error) {
      console.error('❌ Gemini API エラー:', error);
      throw new Error(`Gemini API分析失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async analyzeImageWithObjectDetection(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
    // Gemini 2.5 Flash already includes advanced object detection
    // No need for separate object detection method
    return this.analyzeImage(imageBuffer);
  }

  // Helper method to detect MIME type from buffer
  private static detectMimeType(buffer: Buffer): string {
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
      'image/gif': [0x47, 0x49, 0x46],
    };

    for (const [mimeType, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => buffer[index] === byte)) {
        return mimeType;
      }
    }
    
    return 'image/jpeg'; // Default fallback
  }

  // Extract JSON from Gemini response text
  private static extractJsonFromResponse(responseText: string): GeminiResponse {
    try {
      // Look for JSON block in markdown
      const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse the entire response as JSON
      if (responseText.trim().startsWith('{')) {
        return JSON.parse(responseText);
      }

      // Look for any JSON object in the text
      const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        return JSON.parse(jsonObjectMatch[0]);
      }

      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.error('Response text:', responseText);
      throw new Error('Failed to parse Gemini response as JSON');
    }
  }

  // Convert Gemini response to our ImageAnalysisResult format
  private static convertGeminiResponse(geminiData: GeminiResponse): ImageAnalysisResult {
    const detectedFoods: DetectedFood[] = geminiData.detected_foods?.map((food: GeminiFood, index: number) => ({
      id: `gemini_${Date.now()}_${index}`,
      name: food.name || 'Unknown Food',
      confidence: food.confidence || 0.8,
      estimatedQuantity: food.estimated_weight || 100,
      unit: 'g',
      nutrition: {
        calories: food.nutrition?.calories || 100,
        protein: food.nutrition?.protein || 5,
        carbohydrates: food.nutrition?.carbohydrates || 15,
        fat: food.nutrition?.fat || 3,
        fiber: food.nutrition?.fiber || 2,
        sugar: food.nutrition?.sugar || 5,
        sodium: food.nutrition?.sodium || 50,
        cholesterol: food.nutrition?.cholesterol || 10,
      },
      category: food.category || 'unknown',
    })) || [];

    const totalNutrition: NutritionInfo = geminiData.total_nutrition || this.calculateTotalNutrition(detectedFoods);

    return {
      detectedFoods,
      totalNutrition,
      confidence: geminiData.overall_confidence || 0.8,
      analysisTime: new Date(),
      analysisNotes: geminiData.analysis_notes,
    };
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

  private static labelsToDetectedFoods(labels: VisionLabel[]): DetectedFood[] {
    return labels.map(label => {
      const foodName = this.mapLabelToFood(label.description?.toLowerCase() || '');
      const nutrition = NUTRITION_DATABASE[foodName] || this.getDefaultNutrition();
      
      return {
        id: `vision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: foodName,
        confidence: label.score || 0,
        estimatedQuantity: 100, // Default 100g serving
        unit: 'g',
        nutrition,
        category: 'detected',
      };
    }).filter(food => food.name !== 'unknown');
  }

  private static objectsToDetectedFoods(objects: VisionObject[]): DetectedFood[] {
    return objects.map(obj => {
      const foodName = this.mapLabelToFood(obj.name?.toLowerCase() || '');
      const nutrition = NUTRITION_DATABASE[foodName] || this.getDefaultNutrition();
      
      return {
        id: `vision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        category: 'detected',
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
    total.calories = Math.round(total.calories * 10) / 10;
    total.protein = Math.round(total.protein * 10) / 10;
    total.carbohydrates = Math.round(total.carbohydrates * 10) / 10;
    total.fat = Math.round(total.fat * 10) / 10;
    total.fiber = Math.round(total.fiber * 10) / 10;
    total.sugar = Math.round(total.sugar * 10) / 10;
    total.sodium = Math.round(total.sodium * 10) / 10;
    total.cholesterol = Math.round(total.cholesterol * 10) / 10;

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