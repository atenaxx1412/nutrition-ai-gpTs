// Gemini API テスト
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const https = require('https');

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function downloadTestImage() {
  return new Promise((resolve, reject) => {
    // シンプルな食事画像をダウンロード
    const imageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';
    
    https.get(imageUrl, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    }).on('error', reject);
  });
}

async function testGeminiAPI() {
  try {
    console.log('🔥 Gemini API テスト開始...');
    console.log('🔑 API Key:', process.env.GEMINI_API_KEY ? '設定済み' : '未設定');

    // テスト画像ダウンロード
    console.log('\n📥 テスト用食事画像ダウンロード中...');
    const imageBuffer = await downloadTestImage();
    console.log('✅ 画像ダウンロード完了:', imageBuffer.length, 'bytes');

    // Base64エンコード
    const base64Image = imageBuffer.toString('base64');

    // Gemini分析プロンプト
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
      "estimated_weight": 数値,
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
      "confidence": 0.9,
      "category": "protein"
    }
  ],
  "total_nutrition": {
    "calories": 合計,
    "protein": 合計,
    "carbohydrates": 合計,
    "fat": 合計,
    "fiber": 合計,
    "sugar": 合計,
    "sodium": 合計,
    "cholesterol": 合計
  },
  "analysis_notes": "栄養士としてのアドバイス",
  "overall_confidence": 0.9
}
\`\`\`

食事画像を栄養士の観点で詳しく分析してください。
`;

    console.log('\n🔍 Gemini API で食事分析実行中...');
    
    // Gemini API 呼び出し
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const responseText = result.response.text();
    console.log('\n📊 Gemini API レスポンス:');
    console.log('=' * 50);
    console.log(responseText);
    console.log('=' * 50);

    // JSON抽出試行
    try {
      const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[1]);
        
        console.log('\n✅ JSON解析成功!');
        console.log('\n🍽️ 検出された食材:');
        analysisData.detected_foods?.forEach((food, index) => {
          console.log(`${index + 1}. ${food.name} (${food.estimated_weight}g)`);
          console.log(`   カロリー: ${food.nutrition?.calories}kcal`);
          console.log(`   信頼度: ${(food.confidence * 100).toFixed(1)}%`);
        });

        console.log('\n📈 合計栄養素:');
        const total = analysisData.total_nutrition;
        if (total) {
          console.log(`- カロリー: ${total.calories}kcal`);
          console.log(`- タンパク質: ${total.protein}g`);
          console.log(`- 炭水化物: ${total.carbohydrates}g`);
          console.log(`- 脂質: ${total.fat}g`);
        }

        console.log('\n💬 栄養士のアドバイス:');
        console.log(analysisData.analysis_notes);

        console.log(`\n🎯 総合信頼度: ${(analysisData.overall_confidence * 100).toFixed(1)}%`);
      }
    } catch (parseError) {
      console.log('\n⚠️ JSON解析エラー:', parseError.message);
      console.log('しかし、Gemini APIからのレスポンスは受信できました');
    }

    console.log('\n🎉 Gemini API テスト完了！');
    return true;

  } catch (error) {
    console.error('\n❌ Gemini API エラー:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.error('🔑 APIキーの設定を確認してください');
    } else if (error.message.includes('quota')) {
      console.error('📊 API使用量制限に達しています');
    } else if (error.message.includes('billing')) {
      console.error('💳 課金設定が必要な可能性があります');
    }
    
    return false;
  }
}

// テスト実行
testGeminiAPI()
  .then((success) => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ Gemini API は正常に動作しています！');
      console.log('🚀 食事画像解析システムの準備完了');
    } else {
      console.log('❌ Gemini API に問題があります');
      console.log('🔧 設定を確認してください');
    }
    process.exit(success ? 0 : 1);
  });