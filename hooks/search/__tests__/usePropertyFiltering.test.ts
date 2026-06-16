import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePropertyFiltering } from '../usePropertyFiltering';

// Mock Data
const mockProperties = [
  {
    id: '1',
    title: 'Modern House Sukhumvit',
    title_en: 'Modern House Sukhumvit',
    property_type: 'HOUSE',
    listing_type: 'SALE',
    bedrooms: 3,
    size_sqm: 150,
    province: 'Bangkok',
    popular_area: 'สุขุมวิท',
    popular_area_en: 'Sukhumvit',
    created_at: '2024-01-01',
    created_at_time: 1704067200000
  },
  {
    id: '2',
    title: 'Luxury Condo Sathorn',
    title_en: 'Luxury Condo Sathorn',
    property_type: 'CONDO',
    listing_type: 'RENT',
    bedrooms: 2,
    size_sqm: 80,
    province: 'Bangkok',
    popular_area: 'Sathorn',
    popular_area_en: 'Sathorn',
    created_at: '2024-01-02',
    created_at_time: 1704153600000
  },
  {
    id: '3',
    title: 'Office Space for Rent',
    title_en: 'Office Space for Rent',
    property_type: 'OFFICE_BUILDING',
    listing_type: 'RENT',
    bedrooms: 0,
    size_sqm: 200,
    province: 'Bangkok',
    popular_area: 'Rama 9',
    popular_area_en: 'Rama 9',
    created_at: '2024-01-03',
    created_at_time: 1704240000000
  },
  {
    id: '4',
    title: 'ที่ดินเปล่าใกล้บ้าน',
    property_type: 'LAND',
    listing_type: 'SALE',
    bedrooms: 0,
    size_sqm: 400,
    province: 'Phuket',
    popular_area: 'Rawai',
    created_at: '2024-01-04',
    created_at_time: 1704326400000
  },
  {
    id: '5',
    title: 'Luxury Pool Villa Phuket',
    property_type: 'VILLA',
    listing_type: 'SALE',
    bedrooms: 4,
    size_sqm: 350,
    province: 'Phuket',
    popular_area: 'Bang Tao',
    created_at: '2024-01-05',
    created_at_time: 1704412800000
  }
];

const defaultFilters = {
  keyword: '',
  province: 'ALL',
  type: 'ALL',
  listingType: 'ALL',
  priceType: 'ALL',
  area: 'ALL',
  nearTrain: false,
  petFriendly: false,
  fullyFurnished: false,
  bedrooms: 'ALL',
  isForeigner: false,
  companyRegistered: false,
  isHotDeal: false,
  minPrice: '',
  maxPrice: '',
  minSize: '',
  maxSize: '',
  transitStation: '',
  allowAirbnb: false,
  sort: 'NEWEST'
};

describe('usePropertyFiltering Smart Search', () => {
  
  it('Scenario 1: Searching for "บ้าน" should only return HOUSE types (Land with "บ้าน" in title should be filtered out)', () => {
    const { result } = renderHook(() => usePropertyFiltering(mockProperties as any, { ...defaultFilters, keyword: 'บ้าน' }));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].property_type).toBe('HOUSE');
  });

  it('Scenario 2: Searching for "เช่า ออฟฟิศ" should return Office with Rent status', () => {
    const { result } = renderHook(() => usePropertyFiltering(mockProperties as any, { ...defaultFilters, keyword: 'เช่า ออฟฟิศ' }));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].property_type).toBe('OFFICE_BUILDING');
    expect(result.current.filtered[0].listing_type).toBe('RENT');
  });

  it('Scenario 3: Multi-token search "บ้าน สุขุมวิท" should work even if title only has House and Province is Sukhumvit', () => {
    const { result } = renderHook(() => usePropertyFiltering(mockProperties as any, { ...defaultFilters, keyword: 'บ้าน สุขุมวิท' }));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].id).toBe('1');
  });

  it('Scenario 4: Number sensing "2 นอน" should work', () => {
    const { result } = renderHook(() => usePropertyFiltering(mockProperties as any, { ...defaultFilters, keyword: 'คอนโด 2 นอน' }));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].bedrooms).toBe(2);
  });

  it('Scenario 5: Size sensing "100 ตรม" should work', () => {
    const { result } = renderHook(() => usePropertyFiltering(mockProperties as any, { ...defaultFilters, keyword: 'บ้าน 100 ตรม' }));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].size_sqm).toBeGreaterThanOrEqual(100);
  });

  it('Scenario 6: Russian synonyms "квартира" should find CONDO', () => {
    const { result } = renderHook(() => usePropertyFiltering(mockProperties as any, { ...defaultFilters, keyword: 'квартира' }));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].property_type).toBe('CONDO');
  });

  it('Scenario 7: Chinese (Simplified) "卧室" sensing should work for bedrooms', () => {
    const { result } = renderHook(() => usePropertyFiltering(mockProperties as any, { ...defaultFilters, keyword: '2卧室' }));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].bedrooms).toBe(2);
  });

  it('Scenario 8: Chinese (Traditional) "別墅" should find VILLA types', () => {
    const { result } = renderHook(() => usePropertyFiltering(mockProperties as any, { ...defaultFilters, keyword: '別墅' }));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].property_type).toBe('VILLA');
  });

  it('Scenario 9: Complex Intent "เช่า 2นอน Sukhumvit" should combine all facets', () => {
    const { result } = renderHook(() => usePropertyFiltering(mockProperties as any, { ...defaultFilters, keyword: 'เช่า 2นอน Sukhumvit' }));
    // Note: Our mock data has a 2-bed condo in Sathorn and 3-bed house in Sukhumvit.
    // If we search for 2-bed in Sukhumvit, it should be 0.
    expect(result.current.filtered).toHaveLength(0);
    
    const { result: res2 } = renderHook(() => usePropertyFiltering(mockProperties as any, { ...defaultFilters, keyword: 'เช่า 2นอน Sathorn' }));
    expect(res2.current.filtered).toHaveLength(1);
    expect(res2.current.filtered[0].id).toBe('2');
  });

});
