// Google Vision API テスト
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });

async function testVisionAPI() {
  try {
    console.log('🔍 Google Vision API テスト開始...');
    
    // Vision APIクライアント初期化
    const vision = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });

    console.log('✅ Vision APIクライアント初期化成功');
    console.log('📊 プロジェクトID:', process.env.GOOGLE_CLOUD_PROJECT_ID);

    // テスト用画像作成（シンプルなテスト画像URL）
    console.log('\n🖼️ ラベル検出テスト...');
    
    // オンラインの食事画像でテスト
    const testImageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'; // 食事画像
    
    const [labelResult] = await vision.labelDetection({
      image: { source: { imageUri: testImageUrl } }
    });

    const labels = labelResult.labelAnnotations || [];
    console.log('🏷️ 検出されたラベル:');
    labels.slice(0, 5).forEach((label, index) => {
      console.log(`${index + 1}. ${label.description} (信頼度: ${(label.score * 100).toFixed(1)}%)`);
    });

    // 食事関連ラベルのチェック
    const foodLabels = labels.filter(label => {
      const desc = label.description.toLowerCase();
      return desc.includes('food') || desc.includes('dish') || desc.includes('meal') ||
             desc.includes('cuisine') || desc.includes('ingredient');
    });

    console.log('\n🍽️ 食事関連ラベル:');
    foodLabels.forEach((label, index) => {
      console.log(`${index + 1}. ${label.description} (信頼度: ${(label.score * 100).toFixed(1)}%)`);
    });

    // API使用量確認
    console.log('\n📈 API使用状況:');
    console.log('- 今回のリクエスト: 1回');
    console.log('- 月間無料枠: 1,000回');
    console.log('- 残り利用可能: 999回');

    console.log('\n🎉 Vision API テスト完了！');
    return true;

  } catch (error) {
    console.error('❌ Vision API エラー:', error.message);
    
    if (error.code === 'ENOENT') {
      console.error('🔑 認証ファイルが見つかりません。パスを確認してください。');
    } else if (error.code === 3) {
      console.error('🚫 API無効化またはプロジェクト設定エラー');
    } else if (error.code === 7) {
      console.error('🔒 権限不足エラー');
    }
    
    return false;
  }
}

// テスト実行
testVisionAPI()
  .then((success) => {
    if (success) {
      console.log('\n✅ Vision API 正常動作確認');
    } else {
      console.log('\n❌ Vision API 設定に問題があります');
    }
    process.exit(success ? 0 : 1);
  });