import { Question } from './types';

export const XRAY_QUESTIONS: Question[] = [
  {
    id: 'worst_deal',
    category: 'behavior',
    type: 'text',
    text: "Worst deal you ever did – what happened, what did LPs get, what did YOU personally lose?",
    placeholder: "Be brutally honest. e.g., 'We lost 15% of LP capital because...'"
  },
  {
    id: 'stress_comms',
    category: 'behavior',
    type: 'text',
    text: "What is your real communication cadence during a bad quarter?",
    placeholder: "e.g., Weekly video updates? Or do you go silent until you have 'good news'?"
  },
  {
    id: 'over_budget',
    category: 'operations',
    type: 'text',
    text: "Describe a time you were behind schedule or over budget – what did you tell LPs?",
    placeholder: "Specific example of transparency vs. spin."
  },
  {
    id: 'fee_cutting',
    category: 'ethics',
    type: 'text',
    text: "Under what conditions have you cut your own fees to protect LP returns?",
    placeholder: "Have you ever done it? If not, why?"
  },
  {
    id: 'walk_away',
    category: 'ethics',
    type: 'text',
    text: "Under what conditions would you walk away from a deal even after spending hard money?",
    placeholder: "What is your absolute breaking point?"
  },
  {
    id: 'non_negotiables',
    category: 'behavior',
    type: 'text',
    text: "Top 3 non-negotiables you have in any JV.",
    placeholder: "1. Control of bank acct, 2. Signing power, 3. ..."
  }
];

export const PRENUP_QUESTIONS: Question[] = [
  {
    id: 'resp_asset_mgmt',
    category: 'operations',
    type: 'text',
    text: "Who is ultimately responsible for Asset Management, Contractor Oversight, and driving the business plan?",
    placeholder: "Name one person/role. Not 'we will figure it out'."
  },
  {
    id: 'resp_reporting',
    category: 'operations',
    type: 'text',
    text: "Who handles Monthly Reporting, Lender Relationships, and Investor Communications?",
    placeholder: "Be specific about who writes the updates and talks to the bank."
  },
  {
    id: 'key_decisions',
    category: 'operations',
    type: 'text',
    text: "Who has the final decision rights for major operational pivots (e.g. large rent hikes, >$10k unbudgeted spend)?",
    placeholder: "Sponsor only? Mutual agreement? Majority vote?"
  },
  {
    id: 'capex_overrun',
    category: 'financial',
    type: 'text',
    text: "If the deal is 20% over CapEx budget, exactly how do we handle it?",
    placeholder: "Capital call? GP loan? Pause work? Who funds the gap?"
  },
  {
    id: 'schedule_delay',
    category: 'financial',
    type: 'text',
    text: "If we are 12 months behind the business plan schedule, what is the fix?",
    placeholder: "Fire property manager? Drop rent? Inject cash?"
  },
  {
    id: 'missing_returns',
    category: 'financial',
    type: 'text',
    text: "If we are 10% below projected returns, what is the immediate action plan?",
    placeholder: "Cut fees? Refinance? Sell early?"
  },
  {
    id: 'pref_cash_dist',
    category: 'financial',
    type: 'text',
    text: "Which is more important: Never missing a distribution check, or building a heavy cash safety cushion?",
    placeholder: "Pick one and explain why."
  },
  {
    id: 'brand_vs_money',
    category: 'ethics',
    type: 'text',
    text: "Scenario: A decision will save LP capital but hurt your personal brand/reputation. What do you do?",
    placeholder: "Honest prioritization."
  },
  {
    id: 'decision_rights',
    category: 'operations',
    type: 'select',
    text: "Who has the final 'Kill Switch' decision on selling the asset?",
    options: ["Partner A Only", "Partner B Only", "Mutual Agreement Required", "Majority Vote of LPs"],
    placeholder: "Select an option"
  }
];