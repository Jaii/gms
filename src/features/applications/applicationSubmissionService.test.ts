import { describe, expect, it } from 'vitest'
import type { SubmissionReadinessItem } from './applicationSubmissionService'

function canSubmit(items: SubmissionReadinessItem[]): boolean {
  return items.every((item) => item.complete)
}

describe('submission readiness', () => {
  it('requires every readiness item to be complete', () => {
    expect(
      canSubmit([
        { label: 'Profile', complete: true },
        { label: 'Documents', complete: false },
      ]),
    ).toBe(false)

    expect(
      canSubmit([
        { label: 'Profile', complete: true },
        { label: 'Documents', complete: true },
      ]),
    ).toBe(true)
  })
})
