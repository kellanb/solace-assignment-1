CREATE INDEX IF NOT EXISTS advocates_first_name_idx ON advocates (first_name);
CREATE INDEX IF NOT EXISTS advocates_last_name_idx ON advocates (last_name);
CREATE INDEX IF NOT EXISTS advocates_city_idx ON advocates (city);
CREATE INDEX IF NOT EXISTS advocates_degree_idx ON advocates (degree);
CREATE INDEX IF NOT EXISTS advocates_years_of_experience_idx ON advocates (years_of_experience);
CREATE INDEX IF NOT EXISTS advocates_specialties_idx ON advocates USING GIN (payload jsonb_path_ops);
