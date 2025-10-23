import { describe, it, expect } from 'vitest'
import { buildApiCriteria } from '../data/decisionTree'

describe('buildApiCriteria', () => {
  it('collects product groups and boolean filters from single-choice answers', () => {
    const answers = {
      mobility_ability: 'limited_walking',
      mobility_support_type: 'rollator',
    }

    const criteria = buildApiCriteria(answers)

    expect(criteria.productGroups).toContain('09.12')
    expect(criteria.productGroups).toContain('09.12.02')
    expect(criteria.filters.walker_needed).toBe(true)
    expect(criteria.filters.rollator).toBe(true)
  })

  it('merges multiple values for repeated keys', () => {
    const answers = {
      mobility_ability: 'no_walking',
      mobility_environment: ['indoor', 'outdoor', 'stairs'],
      bathroom_issue: ['shower_standing', 'grab_bars'],
    }

    const criteria = buildApiCriteria(answers)

    expect(criteria.productGroups).toEqual(
      expect.arrayContaining(['09.24.01', '09.40', '04.40.04', '04.40.01']),
    )
    expect(criteria.filters.indoor).toBe(true)
    expect(criteria.filters.outdoor).toBe(true)
    expect(criteria.filters.stairs).toBe(true)
  })

  it('deduplicates product groups collected from multiple answers', () => {
    const answers = {
      mobility_ability: 'limited_walking',
      mobility_environment: ['indoor'],
    }

    const criteria = buildApiCriteria(answers)

    const uniqueGroups = Array.from(new Set(criteria.productGroups))
    expect(criteria.productGroups.length).toBe(uniqueGroups.length)
  })
})
