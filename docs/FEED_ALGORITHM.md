# AgroLink Feed Algorithm

## Production formula

Implemented in `src/lib/feed-algorithm.ts` and SQL view `feed_rank`.

```
score = 0.35 × proximity_score
      + 0.25 × freshness_score
      + 0.20 × engagement_score
      + 0.10 × seller_trust_score
      + 0.10 × ai_demand_score
      - spam_penalty
```

### Component definitions

| Component | Range | Calculation |
|-----------|-------|-------------|
| `proximity_score` | 0–1 | `1 / (1 + distance_km / 10)` when buyer lat/lng known; else 0.5 |
| `freshness_score` | 0–1 | `max(0, 1 - hours_since_post / 168)` (7-day decay) |
| `engagement_score` | 0–1 | `(likes×0.5 + comments×2 + saves×1.5 + views×0.01) / (1 + hours×0.1)` normalized |
| `seller_trust_score` | 0–1 | `0.4×verified + 0.4×(rating/5) + 0.2×completion_rate` |
| `ai_demand_score` | 0–1 | From `ai_analysis.demand_score` or 0.5 default |
| `spam_penalty` | 0–0.5 | `report_count × 0.1 + duplicate_penalty` |

## Fairness rules

1. **Exploration boost:** Sellers with ≤10 total listings get +0.15 to score (shown wider radius)
2. **No pay-to-boost** in MVP — organic only
3. **Deterministic tie-breaker:** Sort by `score DESC, id ASC` (not random)
4. **Cursor pagination:** Keyset on `(feed_score, id)` from DB view
5. **Time decay:** Engagement older than 7 days contributes less

## Anti-gaming

- Rate limit: max 10 listings per user per day
- Duplicate detection: same seller + same crop + same price within 1h → penalty
- Report threshold: 3+ reports → listing hidden pending admin review

## Legacy mock formula (removed from production)

```
Freshness = (48 - hours_old) × 3
Engagement = likes×0.7 + comments×25 + views×0.02
Trust = organic ? 35 : 0
Trending = trending ? 90 : 0
```

Replaced client-side mock ranking with server `feed_rank` view + `src/lib/feed-algorithm.ts`.
