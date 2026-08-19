import { describe, it, expect } from 'vitest';
import { PropertyMatch } from './types';

// Helper matching the ResultCard / LeadForm display logic
function getDisplayTitle(match: PropertyMatch, language: string): string {
  return (
    (language === 'en'
      ? match.project_name_en || match.title_en
      : language === 'cn'
        ? match.project_name_cn || match.title_cn
        : language === 'ru'
          ? match.project_name_ru || match.title_ru
          : null) ||
    match.project_name ||
    (language !== 'th' ? match.title_en : null) ||
    match.title
  );
}

describe('Smart Match Result - Multilingual Project Name Display', () => {
  const propertyWithFullProject: PropertyMatch = {
    id: 'prop-1',
    title: 'ขายคอนโด แอชลี่ย์ สุขุมวิท 24 ชั้น 15 วิวสระ',
    title_en: 'Condo for Sale Ashley Sukhumvit 24 Floor 15 Pool View',
    title_cn: '素坤逸24号阿什利公寓出售 15楼 泳池景观',
    title_ru: 'Продажа кондо Ashley Sukhumvit 24 этаж 15 вид на бассейн',
    project_name: 'ดิ แอชลี่ย์ สุขุมวิท 24',
    project_name_en: 'The Ashley Sukhumvit 24',
    project_name_cn: '阿什利素坤逸24',
    project_name_ru: 'Эшли Сукхумвит 24',
    price: 15000000,
    image_url: 'https://example.com/img.jpg',
    match_score: 95,
    match_reasons: [],
  };

  const propertyWithoutProject: PropertyMatch = {
    id: 'prop-2',
    title: 'ขายที่ดินเปล่า 2 ไร่ ติดถนนใหญ่ บางนา',
    title_en: 'Vacant Land 2 Rai Main Road Bangna',
    title_cn: '邦纳主干道空地2莱出售',
    title_ru: 'Продажа земельного участка 2 Рая Бангна',
    project_name: null,
    project_name_en: null,
    project_name_cn: null,
    project_name_ru: null,
    price: 50000000,
    image_url: 'https://example.com/img2.jpg',
    match_score: 88,
    match_reasons: [],
  };

  const propertyWithOnlyThaiProject: PropertyMatch = {
    id: 'prop-3',
    title: 'บ้านเดี่ยว 2 ชั้น ลาดพร้าว',
    title_en: '2 Storey House Lat Phrao',
    project_name: 'บ้านสุขใจ ลาดพร้าว',
    project_name_en: null,
    project_name_cn: null,
    project_name_ru: null,
    price: 8000000,
    image_url: 'https://example.com/img3.jpg',
    match_score: 90,
    match_reasons: [],
  };

  it('should display project name in Thai when language is th', () => {
    expect(getDisplayTitle(propertyWithFullProject, 'th')).toBe('ดิ แอชลี่ย์ สุขุมวิท 24');
  });

  it('should display project name in English when language is en', () => {
    expect(getDisplayTitle(propertyWithFullProject, 'en')).toBe('The Ashley Sukhumvit 24');
  });

  it('should display project name in Chinese when language is cn', () => {
    expect(getDisplayTitle(propertyWithFullProject, 'cn')).toBe('阿什利素坤逸24');
  });

  it('should display project name in Russian when language is ru', () => {
    expect(getDisplayTitle(propertyWithFullProject, 'ru')).toBe('Эшли Сукхумвит 24');
  });

  it('should fallback to title when property has no project name', () => {
    expect(getDisplayTitle(propertyWithoutProject, 'th')).toBe('ขายที่ดินเปล่า 2 ไร่ ติดถนนใหญ่ บางนา');
    expect(getDisplayTitle(propertyWithoutProject, 'en')).toBe('Vacant Land 2 Rai Main Road Bangna');
    expect(getDisplayTitle(propertyWithoutProject, 'cn')).toBe('邦纳主干道空地2莱出售');
    expect(getDisplayTitle(propertyWithoutProject, 'ru')).toBe('Продажа земельного участка 2 Рая Бангна');
  });

  it('should fallback gracefully when project has only Thai name', () => {
    expect(getDisplayTitle(propertyWithOnlyThaiProject, 'th')).toBe('บ้านสุขใจ ลาดพร้าว');
    // In English, project_name_en is null -> fallback to title_en ('2 Storey House Lat Phrao')
    expect(getDisplayTitle(propertyWithOnlyThaiProject, 'en')).toBe('2 Storey House Lat Phrao');
  });
});
