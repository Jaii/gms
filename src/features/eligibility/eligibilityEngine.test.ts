import { describe, expect, it } from 'vitest'
import { assessEligibility } from './eligibilityEngine'

describe('assessEligibility', () => {
  it('returns ineligible when no active rules are available', () => {
    expect(assessEligibility([])).toEqual({
      eligible: false,
      appliedRuleCodes: [],
      recommendedTuitionSupportPercentage: 0,
    })
  })

  it('selects the active rule with the highest priority', () => {
    const assessment = assessEligibility([
      {
        code: 'R2',
        description: 'Track corridor community support',
        tuitionSupportPercentage: 70,
        active: true,
        priority: 2,
      },
      {
        code: 'R1',
        description: 'Eligible landowner child attending PNG tertiary institution',
        tuitionSupportPercentage: 100,
        active: true,
        priority: 1,
      },
    ])

    expect(assessment).toEqual({
      eligible: true,
      appliedRuleCodes: ['R1', 'R2'],
      recommendedTuitionSupportPercentage: 100,
    })
  })
})
