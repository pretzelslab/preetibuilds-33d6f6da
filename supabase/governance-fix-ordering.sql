-- ─── GOVERNANCE ORDERING FIX ─────────────────────────────────────────────────
-- Run this in the Supabase SQL editor (governance project).
-- Fixes NIST AI RMF area sort_order so all GOVERN areas appear first, then MAP,
-- MEASURE, MANAGE — in correct sequence.
-- Also fixes phase_group for base MEASURE and MANAGE areas.

-- NIST AI RMF — correct sort order
UPDATE areas SET sort_order = 0  WHERE policy_id = 'nist-ai-rmf' AND slug = 'govern-policy';
UPDATE areas SET sort_order = 1  WHERE policy_id = 'nist-ai-rmf' AND slug = 'govern-team-structure';
UPDATE areas SET sort_order = 2  WHERE policy_id = 'nist-ai-rmf' AND slug = 'govern-workforce';
UPDATE areas SET sort_order = 3  WHERE policy_id = 'nist-ai-rmf' AND slug = 'govern-risk-tolerance';
UPDATE areas SET sort_order = 4  WHERE policy_id = 'nist-ai-rmf' AND slug = 'map-populations';
UPDATE areas SET sort_order = 5  WHERE policy_id = 'nist-ai-rmf' AND slug = 'map-context-deployment';
UPDATE areas SET sort_order = 6  WHERE policy_id = 'nist-ai-rmf' AND slug = 'map-scientific-basis';
UPDATE areas SET sort_order = 7  WHERE policy_id = 'nist-ai-rmf' AND slug = 'map-affected-groups';
UPDATE areas SET sort_order = 8  WHERE policy_id = 'nist-ai-rmf' AND slug = 'map-third-party';
UPDATE areas SET sort_order = 9  WHERE policy_id = 'nist-ai-rmf' AND slug = 'map-risk-likelihood';
UPDATE areas SET sort_order = 10 WHERE policy_id = 'nist-ai-rmf' AND slug = 'measure-fairness';
UPDATE areas SET sort_order = 11 WHERE policy_id = 'nist-ai-rmf' AND slug = 'measure-testing-evaluation';
UPDATE areas SET sort_order = 12 WHERE policy_id = 'nist-ai-rmf' AND slug = 'measure-disaggregated';
UPDATE areas SET sort_order = 13 WHERE policy_id = 'nist-ai-rmf' AND slug = 'manage-incidents';
UPDATE areas SET sort_order = 14 WHERE policy_id = 'nist-ai-rmf' AND slug = 'manage-monitoring';

-- Fix phase_group: base MEASURE and MANAGE areas were incorrectly set to "Map & Discover"
UPDATE areas SET phase_group = 'Measure & Assess' WHERE policy_id = 'nist-ai-rmf' AND slug = 'measure-fairness';
UPDATE areas SET phase_group = 'Manage & Respond' WHERE policy_id = 'nist-ai-rmf' AND slug = 'manage-incidents';
