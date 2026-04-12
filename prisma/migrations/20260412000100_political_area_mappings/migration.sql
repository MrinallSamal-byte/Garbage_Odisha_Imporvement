CREATE TABLE IF NOT EXISTS public.political_area_mappings (
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

CREATE INDEX IF NOT EXISTS political_area_mappings_active_city_state_idx
  ON public.political_area_mappings (city, state, is_active);

DROP TRIGGER IF EXISTS political_area_mappings_set_updated_at ON public.political_area_mappings;
CREATE TRIGGER political_area_mappings_set_updated_at
BEFORE UPDATE ON public.political_area_mappings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
