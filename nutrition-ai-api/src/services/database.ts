import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  UserProfile,
  MealRecord,
  NutritionGoal,
  ProgressRecord,
  Family,
} from '@/types/database';

// Collections
const COLLECTIONS = {
  USERS: 'users',
  MEALS: 'meals',
  GOALS: 'goals',
  PROGRESS: 'progress',
  FAMILIES: 'families',
  ANALYSIS: 'analysis',
} as const;

// Helper function to convert Firestore timestamps
const convertTimestamps = (data: Record<string, unknown>) => {
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
};

// User Profile Service
export class UserService {
  static async createUser(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const userRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { success: true, id: userRef.id };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getUser(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        const data = convertTimestamps(userDoc.data());
        return { id: userDoc.id, ...data } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  static async updateUser(userId: string, updates: Partial<UserProfile>) {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        ...updates,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Meal Record Service
export class MealService {
  static async createMeal(meal: Omit<MealRecord, 'id'>) {
    try {
      const mealRef = await addDoc(collection(db, COLLECTIONS.MEALS), meal);
      return { success: true, id: mealRef.id };
    } catch (error) {
      console.error('Error creating meal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getUserMeals(
    userId: string,
    limitCount: number = 50
  ): Promise<MealRecord[]> {
    try {
      const mealsQuery = query(
        collection(db, COLLECTIONS.MEALS),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(mealsQuery);
      return querySnapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { id: doc.id, ...data } as MealRecord;
      });
    } catch (error) {
      console.error('Error getting meals:', error);
      return [];
    }
  }

  static async getMealsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MealRecord[]> {
    try {
      const mealsQuery = query(
        collection(db, COLLECTIONS.MEALS),
        where('userId', '==', userId),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(mealsQuery);
      return querySnapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { id: doc.id, ...data } as MealRecord;
      });
    } catch (error) {
      console.error('Error getting meals by date range:', error);
      return [];
    }
  }

  static async updateMeal(mealId: string, updates: Partial<MealRecord>) {
    try {
      await updateDoc(doc(db, COLLECTIONS.MEALS, mealId), updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating meal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async deleteMeal(mealId: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.MEALS, mealId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting meal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Goal Service
export class GoalService {
  static async createGoal(goal: Omit<NutritionGoal, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const goalRef = await addDoc(collection(db, COLLECTIONS.GOALS), {
        ...goal,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { success: true, id: goalRef.id };
    } catch (error) {
      console.error('Error creating goal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getUserGoals(userId: string): Promise<NutritionGoal[]> {
    try {
      const goalsQuery = query(
        collection(db, COLLECTIONS.GOALS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(goalsQuery);
      return querySnapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { id: doc.id, ...data } as NutritionGoal;
      });
    } catch (error) {
      console.error('Error getting goals:', error);
      return [];
    }
  }

  static async getActiveGoal(userId: string): Promise<NutritionGoal | null> {
    try {
      const goalsQuery = query(
        collection(db, COLLECTIONS.GOALS),
        where('userId', '==', userId),
        where('isActive', '==', true),
        limit(1)
      );
      const querySnapshot = await getDocs(goalsQuery);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = convertTimestamps(doc.data());
        return { id: doc.id, ...data } as NutritionGoal;
      }
      return null;
    } catch (error) {
      console.error('Error getting active goal:', error);
      return null;
    }
  }

  static async updateGoal(goalId: string, updates: Partial<NutritionGoal>) {
    try {
      await updateDoc(doc(db, COLLECTIONS.GOALS, goalId), {
        ...updates,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating goal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Progress Service
export class ProgressService {
  static async createProgress(progress: Omit<ProgressRecord, 'id'>) {
    try {
      const progressRef = await addDoc(collection(db, COLLECTIONS.PROGRESS), progress);
      return { success: true, id: progressRef.id };
    } catch (error) {
      console.error('Error creating progress:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getUserProgress(userId: string): Promise<ProgressRecord[]> {
    try {
      const progressQuery = query(
        collection(db, COLLECTIONS.PROGRESS),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(progressQuery);
      return querySnapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { id: doc.id, ...data } as ProgressRecord;
      });
    } catch (error) {
      console.error('Error getting progress:', error);
      return [];
    }
  }
}

// Family Service
export class FamilyService {
  static async createFamily(family: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const familyRef = await addDoc(collection(db, COLLECTIONS.FAMILIES), {
        ...family,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { success: true, id: familyRef.id };
    } catch (error) {
      console.error('Error creating family:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getFamily(familyId: string): Promise<Family | null> {
    try {
      const familyDoc = await getDoc(doc(db, COLLECTIONS.FAMILIES, familyId));
      if (familyDoc.exists()) {
        const data = convertTimestamps(familyDoc.data());
        return { id: familyDoc.id, ...data } as Family;
      }
      return null;
    } catch (error) {
      console.error('Error getting family:', error);
      return null;
    }
  }

  static async getUserFamilies(userId: string): Promise<Family[]> {
    try {
      const familiesQuery = query(
        collection(db, COLLECTIONS.FAMILIES),
        where('members', 'array-contains-any', [{ userId }])
      );
      const querySnapshot = await getDocs(familiesQuery);
      return querySnapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { id: doc.id, ...data } as Family;
      });
    } catch (error) {
      console.error('Error getting user families:', error);
      return [];
    }
  }
}