// 基本的なFirebase接続テスト
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyDio7qfclMkn_ueaVwXGMqv9yO3QoMCRLE",
  authDomain: "gtps-4d991.firebaseapp.com",
  projectId: "gtps-4d991",
  storageBucket: "gtps-4d991.firebasestorage.app",
  messagingSenderId: "49756703865",
  appId: "1:49756703865:web:85d9eb28a37d94947c98a8"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// テストデータ作成
async function createTestData() {
  try {
    console.log('🔥 Firebase接続テスト開始...');

    // テストユーザー作成
    const testUser = {
      name: "テストユーザー",
      age: 30,
      gender: "male",
      height: 175,
      weight: 70,
      activityLevel: "moderate",
      dietaryRestrictions: [],
      allergies: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const userRef = await addDoc(collection(db, 'users'), testUser);
    console.log('✅ テストユーザー作成成功:', userRef.id);

    // テスト食事記録作成
    const testMeal = {
      userId: userRef.id,
      mealType: "lunch",
      foodItems: [
        {
          id: "rice_001",
          name: "白米",
          quantity: 150,
          unit: "g",
          nutrition: {
            calories: 195,
            protein: 4,
            carbohydrates: 42,
            fat: 0.5,
            fiber: 0.6,
            sugar: 0.2,
            sodium: 8,
            cholesterol: 0
          },
          category: "grain"
        },
        {
          id: "chicken_001", 
          name: "鶏胸肉",
          quantity: 100,
          unit: "g",
          nutrition: {
            calories: 165,
            protein: 31,
            carbohydrates: 0,
            fat: 3.6,
            fiber: 0,
            sugar: 0,
            sodium: 74,
            cholesterol: 85
          },
          category: "protein"
        }
      ],
      totalNutrition: {
        calories: 360,
        protein: 35,
        carbohydrates: 42,
        fat: 4.1,
        fiber: 0.6,
        sugar: 0.2,
        sodium: 82,
        cholesterol: 85
      },
      notes: "昼食 - 鶏胸肉と白米",
      timestamp: new Date(),
      confidence: 0.9,
      analysisMethod: "manual"
    };

    const mealRef = await addDoc(collection(db, 'meals'), testMeal);
    console.log('✅ テスト食事記録作成成功:', mealRef.id);

    // テスト目標作成
    const testGoal = {
      userId: userRef.id,
      type: "maintenance",
      dailyCalorieTarget: 2200,
      proteinTarget: 100,
      carbTarget: 275,
      fatTarget: 73,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const goalRef = await addDoc(collection(db, 'goals'), testGoal);
    console.log('✅ テスト目標作成成功:', goalRef.id);

    // データ読み取りテスト
    console.log('\n📊 データ読み取りテスト...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log('📱 ユーザー数:', usersSnapshot.size);
    
    const mealsSnapshot = await getDocs(collection(db, 'meals'));
    console.log('🍽️ 食事記録数:', mealsSnapshot.size);
    
    const goalsSnapshot = await getDocs(collection(db, 'goals'));
    console.log('🎯 目標数:', goalsSnapshot.size);

    console.log('\n🎉 Firebase基本テスト完了！');
    return {
      userId: userRef.id,
      mealId: mealRef.id,
      goalId: goalRef.id
    };

  } catch (error) {
    console.error('❌ Firebase接続エラー:', error);
    throw error;
  }
}

// テスト実行
createTestData()
  .then((result) => {
    console.log('\n✅ 作成されたテストデータ:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ テスト失敗:', error);
    process.exit(1);
  });