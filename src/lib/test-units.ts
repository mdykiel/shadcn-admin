// Test funkcji dodawania jednostek budżetowych
import { budgetUnitsService } from '@/services/budget-units';
import { useAuthStore } from '@/store/auth';

export async function testAddUnit() {
  try {
    console.log('🧪 Testing unit creation...');

    const testUnit = {
      name: 'Szkoła Podstawowa nr 5 w Krakowie',
      shortName: 'SP5',
      regon: '123456789',
      nip: '123-456-78-90',
      unitType: 'JEDNOSTKA_BUDZETOWA' as const,
      defaultDzial: '801',
      defaultRozdzial: '80101',
    };

    const createdUnit = await budgetUnitsService.create(testUnit);
    console.log('✅ Unit created successfully:', createdUnit);

    // Add to store
    const { addUnit } = useAuthStore.getState();
    addUnit(createdUnit);

    return createdUnit;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

export async function testGetUnits() {
  try {
    console.log('🧪 Testing get units...');
    const units = await budgetUnitsService.getAll();
    console.log('✅ Units retrieved:', units);
    return units;
  } catch (error) {
    console.error('❌ Get units failed:', error);
    throw error;
  }
}

// Expose to window for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).testAddUnit = testAddUnit;
  (window as any).testGetUnits = testGetUnits;
}