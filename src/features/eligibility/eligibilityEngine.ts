export type EligibilityRule = {
  code: string
  description: string
  tuitionSupportPercentage: number
  active: boolean
  priority?: number
}

export type EligibilityAssessment = {
  eligible: boolean
  appliedRuleCodes: string[]
  recommendedTuitionSupportPercentage: number
}

export function assessEligibility(rules: EligibilityRule[]): EligibilityAssessment {
  const activeRules = rules.filter((rule) => rule.active)

  if (activeRules.length === 0) {
    return {
      eligible: false,
      appliedRuleCodes: [],
      recommendedTuitionSupportPercentage: 0,
    }
  }

  const sortedRules = [...activeRules].sort(
    (left, right) => (left.priority ?? 999) - (right.priority ?? 999),
  )
  const selectedRule = sortedRules[0]

  if (!selectedRule) {
    return {
      eligible: false,
      appliedRuleCodes: [],
      recommendedTuitionSupportPercentage: 0,
    }
  }

  return {
    eligible: selectedRule.tuitionSupportPercentage > 0,
    appliedRuleCodes: sortedRules.map((rule) => rule.code),
    recommendedTuitionSupportPercentage: selectedRule.tuitionSupportPercentage,
  }
}
