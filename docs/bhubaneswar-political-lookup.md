# Bhubaneswar Political Lookup

## Database Table

```sql
CREATE TABLE public.political_area_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  data_json jsonb NOT NULL,
  version text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (city, state, version)
);
```

## Success Response

```json
{
  "success": true,
  "data": {
    "status": "matched",
    "latitude": 20.2961,
    "longitude": 85.8245,
    "detected_location": {
      "formatted_address": "Patia, Bhubaneswar, Odisha, India",
      "locality": "Patia",
      "suburb": null,
      "neighbourhood": null,
      "ward": null,
      "ward_number": null,
      "gram_panchayat": null,
      "city": "Bhubaneswar",
      "district": "Khordha",
      "state": "Odisha",
      "pincode": "751024"
    },
    "assembly_constituency": {
      "number": 113,
      "name": "Bhubaneswar North (Uttar)"
    },
    "lok_sabha_constituency": {
      "name": "Bhubaneswar"
    },
    "mla": {
      "name": "Susant Kumar Rout",
      "party_full": "Biju Janata Dal",
      "party_short": "BJD"
    },
    "mla_party": {
      "full": "Biju Janata Dal",
      "short": "BJD"
    },
    "mp": {
      "name": "Aparajita Sarangi",
      "party_full": "Bharatiya Janata Party",
      "party_short": "BJP"
    },
    "mp_party": {
      "full": "Bharatiya Janata Party",
      "short": "BJP"
    },
    "matched_by": "keyword",
    "confidence_score": 0.78,
    "notes": [
      "Matched through normalized locality keyword: patia",
      "Polygon data was not available or did not contain this point, so fallback logic was used.",
      "This is an approximate match based on reverse geocoded locality + ward/GP + keyword mapping."
    ]
  }
}
```

## Ambiguous Response

```json
{
  "success": false,
  "status": "ambiguous",
  "error_code": "AMBIGUOUS_MATCH",
  "message": "Location could not be mapped confidently to a single assembly constituency.",
  "candidates": [
    "Bhubaneswar Central (Madhya)",
    "Ekamra-Bhubaneswar"
  ],
  "matched_by": "keyword_ambiguous"
}
```

## No Match Response

```json
{
  "success": false,
  "status": "not_found",
  "error_code": "NO_MATCH_FOUND",
  "message": "No matching constituency found for the detected location.",
  "matched_by": "none"
}
```
