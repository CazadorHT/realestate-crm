import { describe, it, expect } from 'vitest';
import { blogPostSchema } from './schema';

describe('Blog Post Validation (Zod)', () => {
  const validPost = {
    title: 'New Condo in Bangkok',
    slug: 'new-condo-in-bangkok',
    category: 'Real Estate',
    tags: 'condo, bangkok, luxury',
    is_published: true,
  };

  it('should validate a correct blog post', () => {
    const result = blogPostSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it('should fail if title is missing', () => {
    const result = blogPostSchema.safeParse({ ...validPost, title: '' });
    expect(result.success).toBe(false);
  });

  it('should fail if slug is in wrong format (uppercase)', () => {
    const result = blogPostSchema.safeParse({ ...validPost, slug: 'New-Condo' });
    expect(result.success).toBe(false);
  });

  it('should fail if slug contains underscores', () => {
    const result = blogPostSchema.safeParse({ ...validPost, slug: 'new_condo' });
    expect(result.success).toBe(false);
  });

  it('should accept an empty string or valid URL for cover_image', () => {
    const resultEmpty = blogPostSchema.safeParse({ ...validPost, cover_image: '' });
    expect(resultEmpty.success).toBe(true);

    const resultUrl = blogPostSchema.safeParse({ ...validPost, cover_image: 'https://example.com/image.jpg' });
    expect(resultUrl.success).toBe(true);

    const resultInvalid = blogPostSchema.safeParse({ ...validPost, cover_image: 'not-a-url' });
    expect(resultInvalid.success).toBe(false);
  });
});
