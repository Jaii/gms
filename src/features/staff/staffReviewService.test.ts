import { describe, expect, it } from 'vitest'
import { staffTransitionOptions } from './staffReviewService'

describe('staffTransitionOptions', () => {
  it('includes initial review as the first staff transition', () => {
    expect(staffTransitionOptions[0]).toEqual({
      code: 'initial_review',
      label: 'Move to Initial Review',
    })
  })
})
